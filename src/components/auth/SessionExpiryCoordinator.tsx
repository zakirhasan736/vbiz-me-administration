'use client'

import { Modal } from '@/components/ui/Modal'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { refreshSessionAccessToken } from '@/lib/auth/sessionClient'
import {
  isAuthenticatedWorkspacePath,
  jwtExpiresAt,
  markSessionExpired,
  redirectToLogin,
  SESSION_EXPIRING_EVENT,
  SESSION_FLUSH_DRAFT_EVENT,
  SESSION_IDLE_MS,
  SESSION_RENEW_BEFORE_EXPIRY_MS,
  SESSION_WARNING_SECONDS,
  type SessionExpiryReason,
} from '@/lib/auth/sessionPolicy'
import { updateAuthState } from '@/redux/features/auth/user.slice'
import { Clock3, LoaderCircle, LogOut, RefreshCw } from 'lucide-react'
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
}

const WARNING_DURATION_MS = SESSION_WARNING_SECONDS * 1000
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
  const tokenRef = useRef(token)
  const [warning, setWarning] = useState<SessionWarning | null>(null)
  const [clock, setClock] = useState(0)
  const [isRenewing, setIsRenewing] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [renewalError, setRenewalError] = useState('')

  const currentWarning = sessionManaged && warning?.userId === userId ? warning : null
  const expiresAt = useMemo(() => jwtExpiresAt(token), [token])

  const openWarning = useCallback(
    (reason: SessionExpiryReason) => {
      if (!userId || !isAuthenticatedWorkspacePath(pathname)) return
      if (renewalPendingRef.current) return
      dispatchFlushDraft()
      const now = Date.now()
      setClock(now)
      setRenewalError('')
      setWarning((current) =>
        current?.userId === userId
          ? current
          : {
              deadline: now + WARNING_DURATION_MS,
              reason,
              userId,
            }
      )
    },
    [pathname, userId]
  )

  const renewSession = useCallback(
    async (interactive: boolean) => {
      if (!userId) return
      if (renewalPendingRef.current && !interactive) return
      renewalPendingRef.current = true
      if (interactive) {
        setIsRenewing(true)
        setRenewalError('')
      }

      try {
        const accessToken = await refreshSessionAccessToken(tokenRef.current)
        if (!accessToken) {
          if (interactive) {
            setRenewalError('We could not renew your session. Sign in again or wait for automatic sign out.')
          } else {
            openWarning('expired')
          }
          return
        }

        dispatch(updateAuthState({ token: accessToken }))
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
    if (signOutPendingRef.current || renewalPendingRef.current) return
    signOutPendingRef.current = true
    setIsSigningOut(true)
    markSessionExpired()
    dispatchFlushDraft()
    try {
      await onSignOut()
    } finally {
      redirectToLogin()
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
      const reason = (event as CustomEvent<SessionExpiryReason>).detail
      const recentlyActive = Date.now() - lastActivityRef.current <= SESSION_IDLE_MS
      if (recentlyActive && (reason === 'unauthorized' || reason === 'expired')) {
        void renewSession(false)
        return
      }
      openWarning(reason || 'unauthorized')
    }

    window.addEventListener(SESSION_EXPIRING_EVENT, onSessionExpiring)
    return () => window.removeEventListener(SESSION_EXPIRING_EVENT, onSessionExpiring)
  }, [openWarning, renewSession])

  useEffect(() => {
    if (!sessionManaged || !userId || !token || currentWarning) return

    const evaluate = () => {
      if (renewalPendingRef.current || signOutPendingRef.current || warningOpenRef.current) return
      if (!lastActivityRef.current) return
      const now = Date.now()
      const idleFor = now - lastActivityRef.current
      if (idleFor >= SESSION_IDLE_MS) {
        openWarning('idle')
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

  const remainingMs = Math.max(0, currentWarning.deadline - clock)
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / WARNING_DURATION_MS) * 100))
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
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-400/10">
        <Clock3 className="h-6 w-6 text-amber-600 dark:text-amber-300" />
      </div>
      <h2 id="session-expiry-title" className="text-center text-xl font-bold text-slate-950 dark:text-white">
        Session expiring
      </h2>
      <p
        id="session-expiry-description"
        className="mt-2 text-center text-sm leading-6 font-medium text-slate-600 dark:text-slate-300"
      >
        You have been inactive. Stay logged in to continue without losing your current place.
      </p>

      <div className="mt-6" aria-live="polite">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Automatic sign out</span>
          <span className="tabular-nums">0:{String(remainingSeconds).padStart(2, '0')}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-amber-500 transition-[width] duration-200 ease-linear"
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
        <button
          type="button"
          onClick={() => void renewSession(true)}
          disabled={isBusy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
        >
          {isRenewing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Stay logged in
        </button>
      </div>
    </Modal>
  )
}
