'use client'

import {
  DASHBOARD_PUSH_PROMPT_EVENT,
  dashboardPushPromptSeenThisSession,
  ensureNotificationPermission,
  getNotificationPrefs,
  markDashboardPushPromptSeenThisSession,
  NOTIFICATIONS_EVENT,
} from '@/lib/notifications'
import { Bell, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

/**
 * After login, ask admin / corporate / single-card owners to allow browser
 * notifications until they grant them. Denied sites cannot re-open the native
 * prompt; we still show this panel every login so they can try again.
 */
export function DashboardPushPrompt() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const closeForSession = useCallback(() => {
    markDashboardPushPromptSeenThisSession()
    setOpen(false)
  }, [])

  const maybeOpen = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (!getNotificationPrefs().browserPush) return
    if (Notification.permission === 'granted') return
    setHint(
      Notification.permission === 'denied'
        ? 'Notifications are blocked for this site. Use Allow below, or tap the lock icon in the address bar and set Notifications to Allow.'
        : null
    )
    setOpen(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (!getNotificationPrefs().browserPush) return
    if (Notification.permission === 'granted') return
    if (dashboardPushPromptSeenThisSession()) return

    const timer = window.setTimeout(() => {
      maybeOpen()
      if (Notification.permission === 'default') {
        void ensureNotificationPermission().then((permission) => {
          window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
          if (permission === 'granted') {
            markDashboardPushPromptSeenThisSession()
            setOpen(false)
          }
        })
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [maybeOpen])

  useEffect(() => {
    const onForce = () => maybeOpen()
    window.addEventListener(DASHBOARD_PUSH_PROMPT_EVENT, onForce)
    return () => window.removeEventListener(DASHBOARD_PUSH_PROMPT_EVENT, onForce)
  }, [maybeOpen])

  const handleAllow = async () => {
    setBusy(true)
    setHint(null)
    try {
      const permission = await ensureNotificationPermission()
      window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
      if (permission === 'granted') {
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
          Stay updated on card saves, replies, and admin alerts. Choose Allow in the browser prompt so we can reach you
          after you leave this tab.
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
