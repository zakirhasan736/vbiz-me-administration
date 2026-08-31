'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { refreshSession } from '@/lib/auth/sessionClient'
import {
  isAuthenticatedWorkspacePath,
  isJwtExpired,
  jwtExpiresAt,
  SESSION_RENEW_BEFORE_EXPIRY_MS,
} from '@/lib/auth/sessionPolicy'
import { updateAuthState } from '@/redux/features/auth/user.slice'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Silently rotates access tokens before expiry. No idle timers or expiry popups. */
export function SilentSessionRenewal() {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const sessionManaged = isAuthenticatedWorkspacePath(pathname)
  const { user, token } = useAppSelector((state) => state.user)
  const tokenRef = useRef(token)
  const renewalPendingRef = useRef(false)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    if (!sessionManaged || !user?.id || !token) return

    const maybeRenew = async () => {
      if (renewalPendingRef.current) return
      const currentToken = tokenRef.current
      if (!currentToken) return

      const now = Date.now()
      const expiresAt = jwtExpiresAt(currentToken)
      const shouldRenew =
        isJwtExpired(currentToken, now) || (expiresAt !== null && expiresAt - now <= SESSION_RENEW_BEFORE_EXPIRY_MS)
      if (!shouldRenew) return

      renewalPendingRef.current = true
      try {
        const result = await refreshSession(currentToken)
        if (result.accessToken) {
          dispatch(updateAuthState({ token: result.accessToken }))
        }
      } finally {
        renewalPendingRef.current = false
      }
    }

    void maybeRenew()
    const intervalId = window.setInterval(() => {
      void maybeRenew()
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [dispatch, sessionManaged, token, user?.id])

  return null
}
