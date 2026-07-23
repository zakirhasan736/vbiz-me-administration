'use client'

import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ArrowRight, Bell, Check, ShieldCheck, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { db, isFirebaseAvailable } from '../lib/firebase'
import { hasNotificationChoice, notificationChoiceKey, notifyProfileExperienceSettled } from '../lib/notificationPrefs'

type NotificationModalProps = {
  cardOwnerId?: string
  ownerName?: string
  /** Start the 2s first-visit timer only after preloader / intro is done */
  enabled?: boolean
}

export function NotificationModal({
  cardOwnerId = '91',
  ownerName = 'Michaelangelo Casanova',
  enabled = true,
}: NotificationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const choiceKey = notificationChoiceKey(cardOwnerId)

  const settle = useCallback(() => {
    notifyProfileExperienceSettled()
  }, [])

  useEffect(() => {
    if (!enabled) return

    if (hasNotificationChoice(cardOwnerId)) {
      settle()
      return
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [enabled, cardOwnerId, settle])

  const handleSubscribe = async () => {
    try {
      let subId = localStorage.getItem('vbiz_subscriber_id')
      if (!subId) {
        subId = `sub_${Math.random().toString(36).substring(2, 15)}`
        localStorage.setItem('vbiz_subscriber_id', subId)
      }

      if (isFirebaseAvailable) {
        await addDoc(collection(db, 'subscriptions'), {
          cardId: cardOwnerId,
          subscriberId: subId,
          createdAt: serverTimestamp(),
        })
      } else {
        console.info('[NotificationModal] Local mode — subscription stored in browser only.')
      }

      localStorage.setItem(choiceKey, 'subscribed')
      console.log(`Subscribed to updates for ${ownerName}`)

      setShowSuccess(true)
      window.setTimeout(() => {
        setIsOpen(false)
        settle()
      }, 2000)
    } catch (error) {
      console.error('Notification subscribe failed:', error)
      localStorage.setItem(choiceKey, 'subscribed')
      setShowSuccess(true)
      window.setTimeout(() => {
        setIsOpen(false)
        settle()
      }, 1500)
    }
  }

  const handleDecline = () => {
    localStorage.setItem(choiceKey, 'declined')
    setIsOpen(false)
    settle()
  }

  const firstName = ownerName.split(' ')[0] || ownerName

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-950 shadow-xl"
          >
            <div className="relative z-10 p-6">
              <button
                onClick={handleDecline}
                className="absolute top-4 right-4 rounded-full border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300 focus:outline-none"
              >
                <X size={16} />
              </button>

              {!showSuccess ? (
                <>
                  <div className="mt-2 mb-6 flex justify-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[1rem] border border-zinc-200 bg-zinc-100 text-zinc-950 shadow-sm">
                        <Bell size={28} className="animate-bounce" />
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 rounded-full border border-zinc-800 bg-zinc-950 p-1 text-zinc-100 shadow-sm">
                        <Sparkles size={12} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 text-center">
                    <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-100">Follow {firstName}</h3>
                    <p className="text-sm leading-relaxed font-medium text-zinc-400">
                      Be the first to know when {ownerName}&apos;s card is updated. Get instant notifications for new
                      links, services, and media.
                    </p>
                  </div>

                  <div className="mb-8 space-y-2">
                    <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900 p-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
                        <ShieldCheck size={14} />
                      </div>
                      <span className="text-xs font-medium text-zinc-300">Privacy Focused & Spam Free</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900 p-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
                        <Sparkles size={14} />
                      </div>
                      <span className="text-xs font-medium text-zinc-300">Real-time Platform Updates</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleSubscribe}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-bold text-zinc-950 shadow-sm transition-all hover:bg-white active:scale-[0.98]"
                    >
                      Enable Notifications
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button
                      onClick={handleDecline}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-sm font-bold text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      Not Now
                    </button>
                  </div>

                  <p className="mt-5 text-center text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    One-click opt in • No app required
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-500"
                  >
                    <Check size={36} strokeWidth={3} />
                  </motion.div>
                  <h3 className="mb-2 text-xl font-bold text-zinc-100">You&apos;re All Set!</h3>
                  <p className="text-sm font-medium text-zinc-400">
                    We&apos;ll notify you the moment an update is published.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
