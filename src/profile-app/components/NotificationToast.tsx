'use client'

import { ArrowUpRight, Bell, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

function isSubscribedAnywhere(): boolean {
  if (typeof window === 'undefined') return false
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('vbiz_notification_choice_') && localStorage.getItem(key) === 'subscribed') {
      return true
    }
  }
  return localStorage.getItem('vbiz_notification_choice') === 'subscribed'
}

export const NotificationToast = () => {
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null)

  useEffect(() => {
    const handlePlatformUpdate = (e: Event) => {
      if (!isSubscribedAnywhere()) return
      const detail = (e as CustomEvent).detail as { title: string; message: string }
      setNotification(detail)

      window.setTimeout(() => {
        setNotification(null)
      }, 8000)
    }

    window.addEventListener('vbiz_platform_update', handlePlatformUpdate)
    return () => window.removeEventListener('vbiz_platform_update', handlePlatformUpdate)
  }, [])

  return (
    <AnimatePresence>
      {notification && (
        <div className="fixed top-6 right-6 z-200 w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 shadow-sm">
                <Bell size={18} fill="currentColor" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-100">{notification.title}</h4>
                  <button
                    onClick={() => setNotification(null)}
                    className="text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs leading-relaxed font-medium text-zinc-400">{notification.message}</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  <Sparkles size={10} />
                  Platform Update
                  <ArrowUpRight size={10} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
