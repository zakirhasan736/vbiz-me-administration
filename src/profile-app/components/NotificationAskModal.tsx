import { Bell, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { registerServiceWorker, subscribeUser } from '../lib/pushNotifications'

export const NotificationAskModal = ({
  isOpen,
  onClose,
  onAccept,
  ownerName = 'Michaelangelo C.',
  cardOwnerId,
}: {
  isOpen: boolean
  onClose: () => void
  onAccept: (subscription: PushSubscription, preferences: string[]) => void
  ownerName?: string
  cardOwnerId: string
}) => {
  const [preferences, setPreferences] = useState(['contact', 'video', 'blog', 'company'])

  const togglePreference = (pref: string) => {
    setPreferences((prev) => (prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]))
  }

  const handleAccept = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Push notifications are not supported in this browser.')
      onClose()
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await registerServiceWorker()
        const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!VAPID_PUBLIC_KEY) {
          console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set. Push notifications will be disabled.')
          onClose()
          return
        }
        const sub = await subscribeUser(cardOwnerId, VAPID_PUBLIC_KEY)
        onAccept(sub, preferences)
      } else {
        console.log('Notification permission denied')
        onClose()
      }
    } catch (e) {
      console.error('Error subscribing to push', e)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
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

              <h2 className="mb-2 text-xl font-bold text-zinc-100">Stay in the loop with {ownerName}</h2>
              <p className="mb-6 text-sm text-zinc-400">Choose what to get notified about:</p>

              <div className="mb-6 w-full space-y-2 rounded-xl bg-zinc-950/50 p-4 text-left text-sm text-zinc-300">
                {[
                  { id: 'contact', label: '📞 Updated contact info' },
                  { id: 'video', label: '🎬 New videos or photos' },
                  { id: 'blog', label: '📝 New blog posts' },
                  { id: 'company', label: '🏢 Professional updates' },
                ].map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.includes(p.id)}
                      onChange={() => togglePreference(p.id)}
                      className="rounded"
                    />
                    {p.label}
                  </label>
                ))}
              </div>

              <p className="mb-6 text-xs text-zinc-500">No app needed. Cancel anytime.</p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={handleAccept}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200"
                >
                  <Bell size={16} /> Yes, Keep Me Updated
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
