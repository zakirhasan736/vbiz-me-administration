'use client'

import { Modal } from '@/components/ui/Modal'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { refreshSession, resetRefreshSessionLock } from '@/lib/auth/sessionClient'
import {
  isAuthenticatedWorkspacePath,
  isJwtExpired,
  jwtExpiresAt,
  markSessionExpired,
  redirectToLogin,
  SESSION_EXPIRED_LOGIN_PATH,
  SESSION_EXPIRING_EVENT,
  SESSION_FLUSH_DRAFT_EVENT,
  SESSION_IDLE_MS,
  SESSION_RENEW_BEFORE_EXPIRY_MS,
  SESSION_WARNING_SECONDS,
  type SessionExpiryReason,
} from '@/lib/auth/sessionPolicy'
import { updateAuthState } from '@/redux/features/auth/user.slice'
import { AlertTriangle, Clock3, LoaderCircle, LogIn, LogOut, RefreshCw } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type SessionExpiryCoordinatorProps = {
  onSignOut: () => Promise<void>
}

function dispatchFlushDraft() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SESSION_FLUSH_DRAFT_EVENT))
}

type SessionWarning = {
  deadline: number
  reason: SessionExpiryReason
  userId: string
  /** Refresh already failed — only Sign in / Sign out make sense. */
  hardExpired: boolean
}

const WARNING_DURATION_MS = SESSION_WARNING_SECONDS * 1000
const HARD_EXPIRED_DURATION_MS = 90 * 1000
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'pointermove',
  'mousemove',
  'keydown',
  'scroll',
  'wheel',
  'touchstart',
  'touchmove',
]

function copyForWarning(warning: SessionWarning): { title: string; description: string } {
  if (warning.hardExpired || warning.reason === 'expired' || warning.reason === 'unauthorized') {
    return {
      title: 'Session expired',
      description:
        'Your login session ended. Sign in again to continue in Admin, Corporate, or your back office. Unsaved drafts were saved when possible.',
    }
  }
  return {
    title: 'Session expiring',
    description: 'You have been inactive. Stay logged in to continue without losing your place, or sign out now.',
  }
}

export function SessionExpiryCoordinator({ onSignOut }: SessionExpiryCoordinatorProps) {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const sessionManaged = isAuthenticatedWorkspacePath(pathname)
  const { user, token } = useAppSelector((state) => state.user)
  const userId = user?.id || ''
  const lastActivityRef = useRef(0)
  const warningOpenRef = useRef(false)
  const renewalPendingRef = useRef(false)
  const signOutPendingRef = useRef(false)
  const hardFailRef = useRef(false)
  const tokenRef = useRef(token)
  const [warning, setWarning] = useState<SessionWarning | null>(null)
  const [clock, setClock] = useState(0)
  const [isRenewing, setIsRenewing] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [renewalError, setRenewalError] = useState('')

  const currentWarning = sessionManaged && warning?.userId === userId ? warning : null
  const expiresAt = useMemo(() => jwtExpiresAt(token), [token])
  const isHardExpired = Boolean(currentWarning?.hardExpired)

  const openWarning = useCallback(
    (reason: SessionExpiryReason, hardExpired = false) => {
      if (!userId || !isAuthenticatedWorkspacePath(pathname)) return
      if (renewalPendingRef.current && !hardExpired) return
      dispatchFlushDraft()
      const now = Date.now()
      const expired = hardExpired || reason === 'expired' || reason === 'unauthorized' || hardFailRef.current
      if (expired) hardFailRef.current = true
      setClock(now)
      setRenewalError('')
      setWarning((current) => {
        if (current?.userId === userId) {
          if (expired && !current.hardExpired) {
            return {
              ...current,
              reason,
              hardExpired: true,
              deadline: now + HARD_EXPIRED_DURATION_MS,
            }
          }
          return current
        }
        return {
          deadline: now + (expired ? HARD_EXPIRED_DURATION_MS : WARNING_DURATION_MS),
          reason,
          userId,
          hardExpired: expired,
        }
      })
    },
    [pathname, userId]
  )

  const renewSession = useCallback(
    async (interactive: boolean) => {
      if (!userId) return
      if (hardFailRef.current && !interactive) return
      if (renewalPendingRef.current && !interactive) return
      renewalPendingRef.current = true
      if (interactive) {
        setIsRenewing(true)
        setRenewalError('')
      }

      try {
        const result = await refreshSession(tokenRef.current)
        if (!result.accessToken) {
          hardFailRef.current = true
          if (interactive) {
            setRenewalError('Your session could not be renewed. Please sign in again.')
            openWarning('expired', true)
          } else {
            openWarning(result.hardExpired ? 'expired' : 'unauthorized', true)
          }
          return
        }

        hardFailRef.current = false
        dispatch(updateAuthState({ token: result.accessToken }))
        setWarning(null)
        setRenewalError('')
        lastActivityRef.current = Date.now()
      } finally {
        renewalPendingRef.current = false
        if (interactive) setIsRenewing(false)
      }
    },
    [dispatch, openWarning, userId]
  )

  const finishSignOut = useCallback(async () => {
    if (signOutPendingRef.current) return
    signOutPendingRef.current = true
    setIsSigningOut(true)
    markSessionExpired()
    dispatchFlushDraft()
    resetRefreshSessionLock()
    hardFailRef.current = false
    try {
      await onSignOut()
    } finally {
      redirectToLogin()
    }
  }, [onSignOut])

  const goToLogin = useCallback(async () => {
    if (signOutPendingRef.current) return
    signOutPendingRef.current = true
    setIsSigningOut(true)
    markSessionExpired()
    dispatchFlushDraft()
    resetRefreshSessionLock()
    try {
      await onSignOut()
    } finally {
      if (typeof window !== 'undefined') {
        window.location.replace(SESSION_EXPIRED_LOGIN_PATH)
      }
    }
  }, [onSignOut])

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    warningOpenRef.current = Boolean(currentWarning)
  }, [currentWarning])

  useEffect(() => {
    lastActivityRef.current = Date.now()
    hardFailRef.current = false
  }, [userId])

  useEffect(() => {
    const noteActivity = () => {
      if (warningOpenRef.current) return
      lastActivityRef.current = Date.now()
    }
    const noteVisibleActivity = () => {
      if (document.visibilityState === 'visible') noteActivity()
    }

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, noteActivity, { passive: true }))
    document.addEventListener('visibilitychange', noteVisibleActivity)
    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, noteActivity))
      document.removeEventListener('visibilitychange', noteVisibleActivity)
    }
  }, [])

  useEffect(() => {
    const onSessionExpiring = (event: Event) => {
      const reason = (event as CustomEvent<SessionExpiryReason>).detail || 'unauthorized'
      if (hardFailRef.current) {
        openWarning(reason, true)
        return
      }

      const recentlyActive = Date.now() - lastActivityRef.current <= SESSION_IDLE_MS
      if (recentlyActive && (reason === 'unauthorized' || reason === 'expired')) {
        void renewSession(false)
        return
      }
      openWarning(reason, reason === 'expired' || reason === 'unauthorized')
    }

    window.addEventListener(SESSION_EXPIRING_EVENT, onSessionExpiring)
    return () => window.removeEventListener(SESSION_EXPIRING_EVENT, onSessionExpiring)
  }, [openWarning, renewSession])

  useEffect(() => {
    if (!sessionManaged || !userId || !token || currentWarning) return

    const evaluate = () => {
      if (renewalPendingRef.current || signOutPendingRef.current || warningOpenRef.current || hardFailRef.current) {
        return
      }
      if (!lastActivityRef.current) return
      const now = Date.now()
      const idleFor = now - lastActivityRef.current
      if (idleFor >= SESSION_IDLE_MS) {
        openWarning('idle')
        return
      }
      if (isJwtExpired(token, now)) {
        void renewSession(false)
        return
      }
      if (expiresAt !== null && expiresAt - now <= SESSION_RENEW_BEFORE_EXPIRY_MS) {
        void renewSession(false)
      }
    }

    evaluate()
    const intervalId = window.setInterval(evaluate, 1000)
    return () => window.clearInterval(intervalId)
  }, [currentWarning, expiresAt, openWarning, renewSession, sessionManaged, token, userId])

  useEffect(() => {
    if (!currentWarning) return
    const intervalId = window.setInterval(() => setClock(Date.now()), 250)
    return () => window.clearInterval(intervalId)
  }, [currentWarning])

  useEffect(() => {
    if (!currentWarning || isRenewing) return
    const timeoutId = window.setTimeout(() => void finishSignOut(), Math.max(0, currentWarning.deadline - Date.now()))
    return () => window.clearTimeout(timeoutId)
  }, [currentWarning, finishSignOut, isRenewing])

  if (!currentWarning) return null

  const copy = copyForWarning(currentWarning)
  const remainingMs = Math.max(0, currentWarning.deadline - clock)
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const durationMs = isHardExpired ? HARD_EXPIRED_DURATION_MS : WARNING_DURATION_MS
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / durationMs) * 100))
  const isBusy = isRenewing || isSigningOut

  return (
    <Modal
      open
      preventClose
      labelledBy="session-expiry-title"
      describedBy="session-expiry-description"
      className="max-w-md rounded-2xl p-6 sm:p-7"
      overlayClassName="z-300 bg-slate-950/60"
    >
      <div
        className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${
          isHardExpired ? 'bg-rose-50 dark:bg-rose-400/10' : 'bg-amber-50 dark:bg-amber-400/10'
        }`}
      >
        {isHardExpired ? (
          <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-300" />
        ) : (
          <Clock3 className="h-6 w-6 text-amber-600 dark:text-amber-300" />
        )}
      </div>
      <h2 id="session-expiry-title" className="text-center text-xl font-bold text-slate-950 dark:text-white">
        {copy.title}
      </h2>
      <p
        id="session-expiry-description"
        className="mt-2 text-center text-sm leading-6 font-medium text-slate-600 dark:text-slate-300"
      >
        {copy.description}
      </p>

      <div className="mt-6" aria-live="polite">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{isHardExpired ? 'Redirecting to login' : 'Automatic sign out'}</span>
          <span className="tabular-nums">0:{String(remainingSeconds).padStart(2, '0')}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ease-linear ${
              isHardExpired ? 'bg-rose-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {renewalError ? (
        <p role="alert" className="mt-4 text-center text-xs leading-5 font-semibold text-rose-600 dark:text-rose-300">
          {renewalError}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void finishSignOut()}
          disabled={isBusy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5"
        >
          {isSigningOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign out
        </button>
        {isHardExpired ? (
          <button
            type="button"
            onClick={() => void goToLogin()}
            disabled={isBusy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-400"
          >
            {isSigningOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in again
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void renewSession(true)}
            disabled={isBusy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
          >
            {isRenewing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Stay logged in
          </button>
        )}
      </div>
    </Modal>
  )
}
