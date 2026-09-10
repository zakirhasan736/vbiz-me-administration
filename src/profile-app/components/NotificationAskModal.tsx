'use client'

import { isPushSupported, subscribeToCard } from '@/lib/push/config'
import {
  canShowBrowserNotificationPrompt,
  clearIosPushIntent,
  isIosChrome,
  markIosPushIntent,
  shouldShowAndroidHomeScreenBackupGuide,
  shouldShowIosHomeScreenPushGuide,
} from '@/lib/push/iosPushGuidance'
import {
  BACKEND_NOTIFICATION_PREFERENCE_OPTIONS,
  DEFAULT_BACKEND_NOTIFICATION_PREFERENCES,
  type BackendNotificationPreferenceKey,
  type BackendNotificationPreferences,
} from '@/lib/push/preferenceMapping'
import { IosPushHomeScreenSteps } from '@/profile-app/components/IosPushHomeScreenSteps'
import { Bell, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

function readPushGuideFlags() {
  return {
    iosGuide: shouldShowIosHomeScreenPushGuide(),
    iosChrome: isIosChrome(),
    androidBackup: shouldShowAndroidHomeScreenBackupGuide(),
    canPromptAllow: canShowBrowserNotificationPrompt(),
  }
}

/** Post-contact notification preference modal — same 9 categories as Settings. */
export const NotificationAskModal = ({
  isOpen,
  onClose,
  onAccept,
  ownerName = 'Michaelangelo C.',
  cardOwnerId,
  cardSlug,
}: {
  isOpen: boolean
  onClose: () => void
  onAccept: (preferences: BackendNotificationPreferences) => void
  ownerName?: string
  cardOwnerId: string
  cardSlug: string
}) => {
  const [preferences, setPreferences] = useState<BackendNotificationPreferences>(() => ({
    ...DEFAULT_BACKEND_NOTIFICATION_PREFERENCES,
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iosGuide, setIosGuide] = useState(() => shouldShowIosHomeScreenPushGuide())
  const [iosChrome, setIosChrome] = useState(() => isIosChrome())
  const [androidBackup, setAndroidBackup] = useState(() => shouldShowAndroidHomeScreenBackupGuide())
  const [canPromptAllow, setCanPromptAllow] = useState(() => canShowBrowserNotificationPrompt())
  const [prevOpen, setPrevOpen] = useState(isOpen)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      const flags = readPushGuideFlags()
      setError(null)
      setSubmitting(false)
      setPreferences({ ...DEFAULT_BACKEND_NOTIFICATION_PREFERENCES })
      setIosGuide(flags.iosGuide)
      setIosChrome(flags.iosChrome)
      setAndroidBackup(flags.androidBackup)
      setCanPromptAllow(flags.canPromptAllow)
    }
  }

  const togglePreference = (pref: BackendNotificationPreferenceKey) => {
    setPreferences((prev) => ({ ...prev, [pref]: !prev[pref] }))
  }

  const handleAccept = async () => {
    setSubmitting(true)
    setError(null)

    try {
      if (shouldShowIosHomeScreenPushGuide()) {
        markIosPushIntent(cardSlug)
        setIosGuide(true)
        await subscribeToCard({
          cardSlug,
          cardOwnerId,
          preferences,
        })
      } else {
        if (!isPushSupported()) {
          setError('Push notifications are not supported in this browser.')
          return
        }
        await subscribeToCard({
          cardSlug,
          cardOwnerId,
          preferences,
        })
      }

      clearIosPushIntent(cardSlug)
      onAccept(preferences)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not subscribe to notifications.'
      setError(message)
      if (shouldShowIosHomeScreenPushGuide() || message.toLowerCase().includes('home screen')) {
        setIosGuide(true)
        markIosPushIntent(cardSlug)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full bg-zinc-800 p-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                <Bell size={32} />
              </div>

              <h2 className="mb-2 text-xl font-bold text-zinc-100">
                {iosGuide
                  ? iosChrome
                    ? 'Enable Chrome notifications'
                    : 'Enable iPhone notifications'
                  : `Stay in the loop with ${ownerName}`}
              </h2>
              <p className="mb-6 text-sm text-zinc-400">
                {iosGuide
                  ? iosChrome
                    ? 'Tap below to Allow in Chrome, then Add to Home Screen so push keeps working.'
                    : canPromptAllow
                      ? 'Allow may appear — still add to Home Screen so push keeps working.'
                      : 'If Allow does not appear in the tab, add to Home Screen first, then Allow from the icon.'
                  : 'Choose what to get notified about:'}
              </p>

              {iosGuide ? (
                <IosPushHomeScreenSteps
                  className="mb-6 w-full border-zinc-700 bg-zinc-950/60"
                  variant={iosChrome ? 'ios-chrome' : 'ios'}
                />
              ) : null}

              {!iosGuide ? (
                <>
                  <div className="mb-6 max-h-[40vh] w-full space-y-2 overflow-y-auto rounded-xl bg-zinc-950/50 p-4 text-left text-sm text-zinc-300">
                    {BACKEND_NOTIFICATION_PREFERENCE_OPTIONS.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={preferences[p.id]}
                          onChange={() => togglePreference(p.id)}
                          className="rounded"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                  {androidBackup ? (
                    <IosPushHomeScreenSteps
                      className="mb-6 w-full border-zinc-700 bg-zinc-950/60"
                      variant="android-backup"
                    />
                  ) : null}
                </>
              ) : null}

              {error ? (
                <p className="mb-4 text-xs text-red-400" role="alert">
                  {error}
                </p>
              ) : null}

              <p className="mb-6 text-xs text-zinc-500">
                {iosGuide
                  ? 'If Allow does not appear in the tab, add to Home Screen first, then Allow from the icon.'
                  : androidBackup
                    ? 'Tap Yes to Allow in Chrome. Home Screen below is an optional backup.'
                    : 'No app store download needed. Cancel anytime.'}
              </p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={() => {
                    if (iosGuide) markIosPushIntent(cardSlug)
                    void handleAccept()
                  }}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200 disabled:opacity-60"
                >
                  <Bell size={16} />{' '}
                  {submitting
                    ? 'Subscribing…'
                    : iosGuide
                      ? iosChrome || canPromptAllow
                        ? 'Allow in Chrome / browser'
                        : "I've added it — Enable"
                      : 'Yes, Keep Me Updated'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full rounded-full bg-zinc-800 py-3 text-sm font-medium text-zinc-300 transition-all hover:text-white"
                >
                  No Thanks
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
