'use client'

import {
  DASHBOARD_PUSH_PROMPT_EVENT,
  dashboardPushPromptSeenThisSession,
  ensureNotificationPermission,
  getNotificationPrefs,
  markDashboardPushPromptSeenThisSession,
  NOTIFICATIONS_EVENT,
} from '@/lib/notifications'
import { readNotificationPermission } from '@/lib/push/iosPushGuidance'
import { registerOwnerPushForCurrentUser } from '@/lib/push/registerOwnerPush'
import { Bell, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * After login, ask admin / corporate / single-card owners to allow browser
 * notifications, then register this device as an **owner** Web Push target
 * for their cards (separate from public-card saver/follower push).
 *
 * Once Allow succeeds, the subscription is stored server-side and the service
 * worker delivers OS push even when this tab / browser window is closed.
 */
export function DashboardPushPrompt() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const syncAttempts = useRef(0)

  const closeForSession = useCallback(() => {
    markDashboardPushPromptSeenThisSession()
    setOpen(false)
  }, [])

  const syncOwnerPush = useCallback(async () => {
    if (!getNotificationPrefs().browserPush) return { registered: 0 }
    if (readNotificationPermission() !== 'granted') return { registered: 0 }
    return registerOwnerPushForCurrentUser()
  }, [])

  const maybeOpen = useCallback(() => {
    const permission = readNotificationPermission()
    if (permission === 'unsupported' || permission === 'granted') return
    if (!getNotificationPrefs().browserPush) return
    setHint(
      permission === 'denied'
        ? 'Notifications are blocked for this site. Use Allow below, or tap the lock icon in the address bar and set Notifications to Allow.'
        : null
    )
    setOpen(true)
  }, [])

  // Keep owner Web Push registered after first Allow (retry until token/SW ready).
  useEffect(() => {
    let cancelled = false
    let retryTimer: number | undefined

    const run = async () => {
      if (cancelled) return
      if (!getNotificationPrefs().browserPush) return
      const permission = readNotificationPermission()
      if (permission === 'unsupported') return

      if (permission === 'granted') {
        const result = await syncOwnerPush()
        if (cancelled) return
        if (result.registered > 0) {
          syncAttempts.current = 0
          return
        }
        if (syncAttempts.current < 6) {
          syncAttempts.current += 1
          retryTimer = window.setTimeout(() => void run(), 1200 * syncAttempts.current)
        }
        return
      }

      if (dashboardPushPromptSeenThisSession()) return
      maybeOpen()
      if (readNotificationPermission() === 'default') {
        const next = await ensureNotificationPermission()
        if (cancelled) return
        window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
        if (next === 'granted') {
          await syncOwnerPush()
          markDashboardPushPromptSeenThisSession()
          setOpen(false)
        }
      }
    }

    const bootTimer = window.setTimeout(() => void run(), 400)

    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      if (readNotificationPermission() !== 'granted') return
      syncAttempts.current = 0
      void run()
    }
    const onOnline = () => {
      if (readNotificationPermission() !== 'granted') return
      syncAttempts.current = 0
      void run()
    }

    window.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', onOnline)
    window.addEventListener(DASHBOARD_PUSH_PROMPT_EVENT, maybeOpen)

    return () => {
      cancelled = true
      window.clearTimeout(bootTimer)
      if (retryTimer) window.clearTimeout(retryTimer)
      window.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('online', onOnline)
      window.removeEventListener(DASHBOARD_PUSH_PROMPT_EVENT, maybeOpen)
    }
  }, [maybeOpen, syncOwnerPush])

  const handleAllow = async () => {
    setBusy(true)
    setHint(null)
    try {
      const permission = await ensureNotificationPermission()
      window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
      if (permission === 'granted') {
        syncAttempts.current = 0
        const result = await syncOwnerPush()
        if (result.registered === 0) {
          // Token/SW race — retry shortly; do not require another backoffice visit.
          window.setTimeout(() => void syncOwnerPush(), 1500)
          window.setTimeout(() => void syncOwnerPush(), 4000)
        }
        markDashboardPushPromptSeenThisSession()
        setOpen(false)
        return
      }
      if (permission === 'unsupported') {
        setHint('This browser does not support notifications.')
        return
      }
      setHint(
        'Choose Allow on the browser prompt. If you already blocked this site, open the lock icon in the address bar and set Notifications to Allow, then tap Allow here again.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-500 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="dash-push-title"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0d1222]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
            <Bell className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={closeForSession}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Not now"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id="dash-push-title" className="text-lg font-black text-slate-900 dark:text-white">
          Allow notifications
        </h2>
        <p className="mt-2 text-sm leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          After you choose Allow once, you get alerts for <strong>your cards</strong> even when this page and your
          browser are closed — you do not need to open the backoffice again.
        </p>
        {hint ? (
          <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {hint}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeForSession}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleAllow()}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {busy ? 'Asking browser…' : 'Allow notifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
