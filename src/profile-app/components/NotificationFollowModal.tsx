'use client'

import { isPushSupported, mapPushSubscribeError, sendTestNotification, subscribeToCard } from '@/lib/push/config'
import { markNotificationDeclined, markNotificationSubscribed } from '@/lib/push/notificationRouting'
import { DEFAULT_BACKEND_NOTIFICATION_PREFERENCES } from '@/lib/push/preferenceMapping'
import { notify } from '@/lib/toast/toast'
import { ArrowRight, Bell, Check, ShieldCheck, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

type NotificationFollowModalProps = {
  isOpen: boolean
  onClose: () => void
  cardOwnerId?: string
  cardSlug: string
  ownerName?: string
  onSubscribed?: () => void
}

function isPushServiceGuidance(message: string) {
  return message.toLowerCase().includes('push service') || message.toLowerCase().includes('google services')
}

/** Shared "Follow" enable-notifications popup — first visit, alert button, and post-save flows. */
export function NotificationFollowModal({
  isOpen,
  onClose,
  cardOwnerId = '91',
  cardSlug,
  ownerName = 'Michaelangelo Casanova',
  onSubscribed,
}: NotificationFollowModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setSubmitting(true)
    setError(null)

    try {
      if (!isPushSupported()) {
        throw new Error('This browser does not support push notifications.')
      }

      await subscribeToCard({
        cardSlug,
        cardOwnerId,
        preferences: DEFAULT_BACKEND_NOTIFICATION_PREFERENCES,
      })

      markNotificationSubscribed(cardSlug)
      notify.success("You're subscribed! We'll notify you when this card is updated.")
      setShowSuccess(true)
      onSubscribed?.()
    } catch (subscribeError) {
      const mapped = mapPushSubscribeError(subscribeError)
      const message = mapped.message || 'Could not enable notifications.'
      setError(message)
      notify.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendTest = async () => {
    setTesting(true)
    try {
      await sendTestNotification(cardSlug)
      notify.success('Test notification sent. Check your system tray.')
    } catch (testError) {
      const message = testError instanceof Error ? testError.message : 'Could not send test notification.'
      notify.error(message)
    } finally {
      setTesting(false)
    }
  }

  const handleDecline = () => {
    markNotificationDeclined(cardSlug)
    onClose()
  }

  const handleDone = () => {
    setShowSuccess(false)
    onClose()
  }

  const firstName = ownerName.split(' ')[0] || ownerName

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="vbiz-modal-backdrop fixed inset-0 z-[210] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="vbiz-modal-panel relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-xl"
          >
            <div className="relative z-10 p-6">
              <button
                type="button"
                onClick={showSuccess ? handleDone : handleDecline}
                className="vbiz-modal-close absolute top-4 right-4 rounded-full border p-1.5 transition-all focus:outline-none"
              >
                <X size={16} />
              </button>

              {!showSuccess ? (
                <>
                  <div className="mt-2 mb-6 flex justify-center">
                    <div className="relative">
                      <div className="vbiz-pill-icon flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm">
                        <Bell size={28} className="animate-bounce" />
                      </div>
                      <div className="vbiz-modal-icon-chip absolute -top-1.5 -right-1.5 rounded-full p-1 shadow-sm">
                        <Sparkles size={12} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 text-center">
                    <h3 className="vbiz-title notranslate mb-2 text-xl font-bold tracking-tight">Follow {firstName}</h3>
                    <p className="vbiz-description text-sm leading-relaxed font-medium">
                      Be the first to know when <span className="notranslate">{ownerName}</span>&apos;s card is updated.
                      Get instant notifications for new links, services, and media.
                    </p>
                  </div>

                  <div className="mb-8 space-y-2">
                    <div className="vbiz-modal-row flex items-center gap-2.5 rounded-xl border p-2.5">
                      <div className="vbiz-pill-icon flex h-6 w-6 items-center justify-center rounded-md border">
                        <ShieldCheck size={14} />
                      </div>
                      <span className="vbiz-description text-xs font-medium">Privacy Focused & Spam Free</span>
                    </div>
                    <div className="vbiz-modal-row flex items-center gap-2.5 rounded-xl border p-2.5">
                      <div className="vbiz-pill-icon flex h-6 w-6 items-center justify-center rounded-md border">
                        <Sparkles size={14} />
                      </div>
                      <span className="vbiz-description text-xs font-medium">Real-time Platform Updates</span>
                    </div>
                  </div>

                  {error ? (
                    <div className="mb-4 space-y-1.5 text-center" role="alert">
                      <p className="text-xs text-red-400">{error}</p>
                      {isPushServiceGuidance(error) ? (
                        <p className="vbiz-description text-[10px] leading-relaxed opacity-80">
                          Still stuck? Open DevTools → Application → Clear site data for this origin, then retry in
                          Chrome.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => void handleSubscribe()}
                      disabled={submitting}
                      className="vbiz-modal-btn-primary group flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      {submitting ? 'Enabling…' : 'Enable Notifications'}
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDecline}
                      className="vbiz-modal-btn-secondary w-full rounded-full py-3 text-sm font-bold transition-all"
                    >
                      Not Now
                    </button>
                  </div>

                  <p className="vbiz-pin mt-5 text-center text-[10px] font-semibold tracking-wider uppercase opacity-80">
                    One-click opt in • No app required
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-500"
                  >
                    <Check size={36} strokeWidth={3} />
                  </motion.div>
                  <h3 className="vbiz-title mb-2 text-xl font-bold">You&apos;re All Set!</h3>
                  <p className="vbiz-description mb-6 text-sm font-medium">
                    We&apos;ll notify you the moment an update is published.
                  </p>
                  <div className="flex w-full flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => void handleSendTest()}
                      disabled={testing}
                      className="vbiz-modal-btn-primary w-full rounded-full py-3 text-sm font-bold transition-all disabled:opacity-60"
                    >
                      {testing ? 'Sending…' : 'Send test notification'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDone}
                      className="vbiz-modal-btn-secondary w-full rounded-full py-3 text-sm font-bold transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
