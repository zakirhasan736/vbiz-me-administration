'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import type { IUser } from '@/interfaces/user.interface'
import { api, baseUrl } from '@/redux/api/api'
import { useGetAuthorQuery } from '@/redux/features/auth/auth.api'
import { logout as clearAuth, updateAuthState } from '@/redux/features/auth/user.slice'
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

function useAuthBootstrap() {
  const dispatch = useAppDispatch()
  const persistReady = usePersistReady()
  const { user, isLoading } = useAppSelector((state) => state.user)
  const hasUser = Boolean(user?.id)

  // Restore from Redux token (email login) or httpOnly cookies (OAuth redirect).
  // Logout awaits cookie clear before wiping Redux so this cannot resurrect a session.
  const { data, isSuccess, isError, isFetching, isUninitialized } = useGetAuthorQuery(undefined, {
    skip: !persistReady || hasUser,
  })

  useEffect(() => {
    if (!persistReady) return

    if (hasUser) {
      if (isLoading) {
        dispatch(updateAuthState({ isLoading: false }))
      }
      return
    }

    if (isFetching || isUninitialized) {
      if (!isLoading) {
        dispatch(updateAuthState({ isLoading: true }))
      }
      return
    }

    if (isSuccess && data?.data) {
      const profile = data.data
      dispatch(updateAuthState({ user: profile, isLoading: false }))

      // OAuth (and cookie sessions) may not match a stale persisted Bearer token — always sync.
      void hydrateAccessToken().then((accessToken) => {
        if (!accessToken) return
        dispatch(updateAuthState({ token: accessToken }))
      })
      return
    }

    if (isError || isSuccess) {
      dispatch(updateAuthState({ user: null, token: null, isLoading: false }))
    }
  }, [persistReady, hasUser, isLoading, isFetching, isUninitialized, isSuccess, isError, data, user, dispatch])
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  useAuthBootstrap()
  return <>{children}</>
}

export async function logout(): Promise<void> {
  const token = store.getState().user.token

  // Clear httpOnly cookies first so cookie-based session restore cannot re-login.
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
