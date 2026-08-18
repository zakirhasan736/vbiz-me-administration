'use client'

import { useAppSelector } from '@/hooks/redux'
import type { IUser } from '@/interfaces/user.interface'
import {
  isJwtExpired,
  redirectToLogin,
  redirectToRoleHome,
  shouldSilentlyRefreshSession,
} from '@/lib/auth/sessionPolicy'
import { hydrateCompletedTours } from '@/lib/dashboardTour'
import { api, baseUrl } from '@/redux/api/api'
import { logout as clearAuth, updateAuthState, updateUser } from '@/redux/features/auth/user.slice'
import { persistor, store } from '@/redux/store'
import { useEffect, useState, type ReactNode } from 'react'

/** App-facing user shape (maps backend profile → existing UI fields). */
export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  photoURL: string | null
}

type AuthState = { user: AuthUser | null; loading: boolean }

export function mapToAuthUser(user: Partial<IUser> | null | undefined): AuthUser | null {
  if (!user?.id) return null

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: user.name ?? null,
    emailVerified: true,
    photoURL: user.avatar ?? null,
  }
}

function usePersistReady() {
  const [ready, setReady] = useState(() => persistor.getState().bootstrapped)

  useEffect(() => {
    if (ready) return

    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        setReady(true)
      }
    })

    return unsubscribe
  }, [ready])

  return ready
}

export function useAuth(): AuthState {
  const { user, isLoading } = useAppSelector((state) => state.user)
  const persistReady = usePersistReady()

  return {
    user: mapToAuthUser(user),
    loading: !persistReady || isLoading,
  }
}

async function hydrateAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null

    const body = (await res.json()) as {
      success?: boolean
      data?: { accessToken?: string }
    }
    return body?.success && body?.data?.accessToken ? body.data.accessToken : null
  } catch {
    return null
  }
}

function clearServerSession(): void {
  void fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => undefined)
}

function authorHeaders(): HeadersInit {
  const token = store.getState().user.token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * One-shot cookie/session restore. Must not use useGetAuthorQuery here:
 * a new `{ skip }` object every render made RTK Query setState in a loop
 * (Maximum update depth exceeded) and hammered GET /auth/author → 403.
 */
function useAuthBootstrap() {
  const persistReady = usePersistReady()

  useEffect(() => {
    if (!persistReady) return

    let cancelled = false

    const finishLoading = () => {
      if (store.getState().user.isLoading) {
        store.dispatch(updateAuthState({ isLoading: false }))
      }
    }

    const clearExpiredSession = () => {
      clearServerSession()
      store.dispatch(clearAuth())
      store.dispatch(api.util.resetApiState())
      redirectToLogin()
    }

    const syncOwnerToken = (role?: string | null) => {
      if (!shouldSilentlyRefreshSession(role)) return

      void hydrateAccessToken().then((accessToken) => {
        if (cancelled) return
        if (!accessToken) {
          clearExpiredSession()
          return
        }
        if (store.getState().user.token !== accessToken) {
          store.dispatch(updateAuthState({ token: accessToken }))
        }
        redirectToRoleHome(role)
      })
    }

    const persistedUser = store.getState().user.user
    if (persistedUser?.id) {
      if (!shouldSilentlyRefreshSession(persistedUser.role)) {
        if (isJwtExpired(store.getState().user.token)) {
          clearExpiredSession()
          return () => {
            cancelled = true
          }
        }

        finishLoading()
        redirectToRoleHome(persistedUser.role)
        return () => {
          cancelled = true
        }
      }

      finishLoading()
      syncOwnerToken(persistedUser.role)
      return () => {
        cancelled = true
      }
    }

    if (!store.getState().user.isLoading) {
      store.dispatch(updateAuthState({ isLoading: true }))
    }

    void (async () => {
      try {
        const res = await fetch(`${baseUrl}/auth/author`, {
          method: 'GET',
          credentials: 'include',
          headers: authorHeaders(),
        })
        if (cancelled) return
        // Login can finish while the initial anonymous author request is in flight.
        // Never let that stale response overwrite the newer authenticated state.
        if (store.getState().user.user?.id) return

        if (!res.ok) {
          store.dispatch(updateAuthState({ user: null, token: null, isLoading: false }))
          return
        }

        const body = (await res.json()) as { data?: Partial<IUser> }
        const profile = body?.data
        if (!profile?.id) {
          store.dispatch(updateAuthState({ user: null, token: null, isLoading: false }))
          return
        }

        store.dispatch(updateAuthState({ user: profile, isLoading: false }))
        if (profile.id && Array.isArray(profile.completedTours)) {
          hydrateCompletedTours(profile.id, profile.completedTours)
        }
        syncOwnerToken(profile.role)
        redirectToRoleHome(profile.role)
      } catch {
        if (!cancelled) {
          store.dispatch(updateAuthState({ user: null, token: null, isLoading: false }))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [persistReady])
}

function AccountStatusSync() {
  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      const { user } = store.getState().user
      if (!user?.id) return

      if (!shouldSilentlyRefreshSession(user.role) && isJwtExpired(store.getState().user.token)) {
        store.dispatch(clearAuth())
        store.dispatch(api.util.resetApiState())
        redirectToLogin()
        return
      }

      try {
        const res = await fetch(`${baseUrl}/auth/author`, {
          method: 'GET',
          credentials: 'include',
          headers: authorHeaders(),
        })
        if (!res.ok || cancelled) return

        const body = (await res.json()) as { data?: Partial<IUser> }
        const remote = body?.data
        if (!remote?.id) return

        const current = store.getState().user.user
        if (!current?.id || current.id !== remote.id) return

        const patch: Partial<IUser> = {}
        if (remote.accountStatus != null && current.accountStatus !== remote.accountStatus) {
          patch.accountStatus = remote.accountStatus
        }
        if (typeof remote.isActive === 'boolean' && current.isActive !== remote.isActive) {
          patch.isActive = remote.isActive
        }
        if (Array.isArray(remote.completedTours)) {
          const same =
            Array.isArray(current.completedTours) &&
            current.completedTours.length === remote.completedTours.length &&
            current.completedTours.every((key, i) => key === remote.completedTours?.[i])
          if (!same) patch.completedTours = remote.completedTours
          if (current.id) hydrateCompletedTours(current.id, remote.completedTours)
        }
        if (Object.keys(patch).length === 0) return

        store.dispatch(updateUser(patch))
      } catch {
        // Ignore transient failures.
      }
    }

    const intervalId = window.setInterval(() => {
      void sync()
    }, 60_000)
    window.addEventListener('focus', sync)
    void sync()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return null
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  useAuthBootstrap()
  return (
    <>
      <AccountStatusSync />
      {children}
    </>
  )
}

export async function logout(): Promise<void> {
  const token = store.getState().user.token

  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    // Still clear local session below.
  }

  store.dispatch(clearAuth())
  store.dispatch(api.util.resetApiState())
  await persistor.flush()

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('persist:user')
  }
}
