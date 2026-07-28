'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import type { IUser } from '@/interfaces/user.interface'
import { baseUrl } from '@/redux/api/api'
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

function useAuthBootstrap() {
  const dispatch = useAppDispatch()
  const persistReady = usePersistReady()
  const { user, isLoading, token } = useAppSelector((state) => state.user)
  const hasUser = Boolean(user?.id)

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
      dispatch(updateAuthState({ user: data.data, isLoading: false }))
      return
    }

    if ((isError || isSuccess) && (isLoading || user || token)) {
      dispatch(updateAuthState({ user: null, token: null, isLoading: false }))
    }
  }, [persistReady, hasUser, isLoading, isFetching, isUninitialized, isSuccess, isError, data, user, token, dispatch])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthBootstrap()
  return <>{children}</>
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
    // Always clear local session even if the network call fails.
  } finally {
    store.dispatch(clearAuth())
  }
}
