'use client'

import { fetchPushStatus, unsubscribeFromCard, updateCardBackendPreferences } from '@/lib/push/config'
import {
  BACKEND_NOTIFICATION_PREFERENCE_OPTIONS,
  DEFAULT_BACKEND_NOTIFICATION_PREFERENCES,
  type BackendNotificationPreferenceKey,
  type BackendNotificationPreferences,
} from '@/lib/push/preferenceMapping'
import { notify } from '@/lib/toast/toast'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { Bell, BellOff, BellRing, Loader2, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export const NotificationSettingsModal = ({
  isOpen,
  onClose,
  cardSlug = 'preview',
  onReEnable,
}: {
  isOpen: boolean
  onClose: () => void
  cardSlug?: string
  /** Called when the user wants to re-enable after unfollowing (opens the enable popup). */
  onReEnable?: () => void
}) => {
  const [preferences, setPreferences] = useState<BackendNotificationPreferences>(
    () => DEFAULT_BACKEND_NOTIFICATION_PREFERENCES
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unfollowing, setUnfollowing] = useState(false)
  const [unfollowed, setUnfollowed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const togglePreference = (pref: BackendNotificationPreferenceKey) => {
    setPreferences((prev) => ({ ...prev, [pref]: !prev[pref] }))
  }

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const load = async () => {
      setUnfollowed(false)
      setLoading(true)
      setError(null)
      setMessage(null)
      try {
        const status = await fetchPushStatus(cardSlug)
        if (cancelled) return
        if (status.backendPreferences) {
          setPreferences(status.backendPreferences)
        } else {
          setPreferences(DEFAULT_BACKEND_NOTIFICATION_PREFERENCES)
        }
      } catch {
        if (!cancelled) setPreferences(DEFAULT_BACKEND_NOTIFICATION_PREFERENCES)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const timer = window.setTimeout(() => void load(), 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isOpen, cardSlug])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const result = await updateCardBackendPreferences(cardSlug, preferences)
      setPreferences(result.preferences)
      const successMessage = result.message
      setMessage(successMessage)
      notify.success(successMessage)
    } catch (e) {
      const failureMessage = e instanceof Error ? e.message : 'Could not save your notification preferences.'
      setError(failureMessage)
      notify.error(failureMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleUnfollow = async () => {
    setUnfollowing(true)
    setError(null)
    setMessage(null)
    try {
      await unsubscribeFromCard(cardSlug)
      setUnfollowed(true)
      notify.success('You unfollowed this card. Notifications are turned off.')
    } catch (e) {
      const failureMessage = e instanceof Error ? e.message : 'Could not unfollow this card.'
      setError(failureMessage)
      notify.error(failureMessage)
    } finally {
      setUnfollowing(false)
    }
  }

  const handleReEnable = () => {
    if (onReEnable) {
      onReEnable()
    } else {
      onClose()
    }
  }

  return (
    <ProfileModalShell
      key={cardSlug}
      isOpen={isOpen}
      onClose={onClose}
      backdropClassName="vbiz-modal-backdrop fixed inset-0 z-100 flex items-end justify-center p-0 backdrop-blur-md sm:items-center sm:p-4"
      panelClassName="relative flex h-[calc(100dvh-30px)] max-h-[calc(100dvh-30px)] w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-2xl"
    >
      <div className="relative flex min-h-0 w-full max-w-sm flex-1 flex-col overflow-y-auto p-5 sm:max-w-none sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="vbiz-modal-close absolute top-5 right-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all active:scale-95"
          aria-label="Close notification settings"
        >
          <X size={16} />
        </button>

        {unfollowed ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-5 text-center">
            <div className="vbiz-modal-icon-chip flex h-14 w-14 items-center justify-center rounded-full">
              <BellOff size={24} />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="vbiz-title text-xl font-bold">Notifications turned off</h2>
              <p className="vbiz-description text-sm">
                You won&apos;t get updates for this card anymore. You can re-enable them anytime.
              </p>
            </div>
            <div className="flex w-full flex-col gap-5">
              <button
                type="button"
                onClick={handleReEnable}
                className="vbiz-modal-btn-primary vbiz-btn flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-all active:scale-[0.98]"
                data-role="primary"
              >
                <BellRing size={16} /> Re-enable Notifications
              </button>
              <button
                type="button"
                onClick={onClose}
                className="vbiz-modal-btn-secondary vbiz-btn w-full rounded-full py-3 text-sm font-medium transition-all active:scale-[0.98]"
                data-role="secondary"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-full flex-col gap-5 sm:min-h-0">
            <div className="flex shrink-0 flex-col gap-2 pr-10">
              <div className="flex items-center gap-3">
                <div className="vbiz-modal-icon-chip flex h-8 w-8 items-center justify-center rounded-full">
                  <Bell size={16} />
                </div>
                <h2 className="vbiz-title text-xl font-bold">Notification Settings</h2>
              </div>
              <p className="vbiz-description text-md">Choose what to get notified about:</p>
            </div>

            <div className="vbiz-modal-row text-md flex min-h-0 w-full flex-1 flex-col justify-between gap-0 rounded-xl p-4 font-medium">
              {loading ? (
                <div className="vbiz-description flex flex-1 items-center justify-center py-6">
                  <Loader2 size={20} className="vbiz-pin animate-spin" />
                </div>
              ) : (
                BACKEND_NOTIFICATION_PREFERENCE_OPTIONS.map((p) => (
                  <label key={p.id} className="flex min-h-[36px] cursor-pointer items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      checked={preferences[p.id]}
                      onChange={() => togglePreference(p.id)}
                      className="rounded border-[color:var(--vbiz-border)] bg-[color:var(--vbiz-surface)] text-[color:var(--vbiz-accent)] focus:ring-[color:var(--vbiz-accent)]"
                    />
                    <span className="leading-snug">{p.label}</span>
                  </label>
                ))
              )}
            </div>

            {(message || error) && (
              <div className="flex shrink-0 flex-col gap-2">
                {message ? <p className="text-xs text-green-500">{message}</p> : null}
                {error ? (
                  <p className="text-xs text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-auto flex shrink-0 flex-col gap-5">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="vbiz-modal-btn-primary vbiz-btn flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                data-role="primary"
              >
                <Save size={16} /> {saving ? 'Saving…' : 'Save Preferences'}
              </button>
              <button
                type="button"
                onClick={() => void handleUnfollow()}
                disabled={unfollowing}
                className="w-full rounded-full border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-60"
              >
                {unfollowing ? 'Unfollowing…' : 'Unfollow This Card'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ProfileModalShell>
  )
}
