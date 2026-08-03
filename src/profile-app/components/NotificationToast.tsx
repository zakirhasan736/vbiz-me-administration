'use client'

import { buildProfilePath } from '@/lib/profileRoutes'
import { PLATFORM_UPDATE_EVENT } from '@/lib/push/notificationExperience'
import { initialsFromName, isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import type { PlatformUpdateDetail } from '@/lib/push/types'
import { ChevronRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

const AUTO_DISMISS_MS = 12000
const DISMISSED_STORAGE_KEY = 'vbiz_dismissed_notifications'
const MAX_DISMISSED_KEYS = 50

function notificationKey(detail: PlatformUpdateDetail): string {
  return [detail.slug ?? '', detail.title ?? '', detail.message ?? ''].join('|')
}

function loadDismissedKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function persistDismissedKeys(keys: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    const list = Array.from(keys).slice(-MAX_DISMISSED_KEYS)
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore storage errors
  }
}

function NotificationAvatar({
  businessName,
  imageUrl,
  videoUrl,
}: {
  businessName: string
  imageUrl?: string
  videoUrl?: string
}) {
  const staticSrc = imageUrl?.trim()
  const videoSrc = !staticSrc ? videoUrl?.trim() || '' : ''
  const showVideo = Boolean(videoSrc) && isVideoAvatarSrc(videoSrc)
  const initials = initialsFromName(businessName)

  return (
    <div className="relative shrink-0">
      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-700/60 bg-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        {staticSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={staticSrc} alt={businessName} className="h-full w-full object-cover" />
        ) : showVideo ? (
          <video src={videoSrc} autoPlay loop muted playsInline className="h-full w-full object-cover" aria-hidden />
        ) : (
          <span className="text-base font-bold text-zinc-100">{initials}</span>
        )}
      </div>
    </div>
  )
}

export const NotificationToast = () => {
  const [notification, setNotification] = useState<PlatformUpdateDetail | null>(null)

  const dismissedKeysRef = useRef<Set<string>>(new Set())
  const currentKeyRef = useRef<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    dismissedKeysRef.current = loadDismissedKeys()
  }, [])

  const clearAutoDismiss = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const dismiss = useCallback(() => {
    clearAutoDismiss()
    currentKeyRef.current = null
    setNotification(null)
  }, [clearAutoDismiss])

  useEffect(() => {
    const handlePlatformUpdate = (e: Event) => {
      const detail = (e as CustomEvent<PlatformUpdateDetail>).detail
      if (!detail) return

      // Service worker already delivered this push — always surface the in-app toast.
      const key = notificationKey(detail)
      if (dismissedKeysRef.current.has(key)) return
      if (currentKeyRef.current === key) return

      dismissedKeysRef.current.add(key)
      persistDismissedKeys(dismissedKeysRef.current)
      currentKeyRef.current = key

      clearAutoDismiss()
      setNotification(detail)

      timeoutRef.current = window.setTimeout(() => {
        dismiss()
      }, AUTO_DISMISS_MS)
    }

    window.addEventListener(PLATFORM_UPDATE_EVENT, handlePlatformUpdate)
    return () => {
      window.removeEventListener(PLATFORM_UPDATE_EVENT, handlePlatformUpdate)
      clearAutoDismiss()
    }
  }, [clearAutoDismiss, dismiss])

  const businessName = notification?.businessName ?? 'vBiz Me'
  const accentColor = '#ebd675'
  const imageUrl = notification?.avatarImageUrl || notification?.avatarUrl
  const videoUrl = !imageUrl ? notification?.avatarVideoUrl : undefined
  const title = notification?.title?.trim() || `${businessName} · Update`
  const rawMessage = notification?.message?.trim() || ''
  const displayLink =
    (typeof notification?.displayLink === 'string' && notification.displayLink.trim()) ||
    (notification?.slug ? `${window.location.host}/${notification.slug}` : '')
  const message =
    rawMessage ||
    (displayLink
      ? `${businessName} has a new update on their card.\nOpen card · ${displayLink}`
      : 'Tap to view the latest on this card.')
  const targetUrl = notification?.url || (notification?.slug ? buildProfilePath(notification.slug) : '')

  const handleOpenTarget = useCallback(() => {
    if (!targetUrl) return
    dismiss()
    window.location.href = targetUrl
  }, [targetUrl, dismiss])

  const isClickable = Boolean(targetUrl)

  return (
    <AnimatePresence>
      {notification ? (
        <div className="pointer-events-none fixed inset-x-3 top-3 z-200 flex justify-center sm:inset-x-auto sm:top-auto sm:right-8 sm:bottom-24 sm:justify-end">
          <motion.div
            initial={{ opacity: 0, x: 80, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? handleOpenTarget : undefined}
            onKeyDown={
              isClickable
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleOpenTarget()
                    }
                  }
                : undefined
            }
            className={`pointer-events-auto relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/95 p-3.5 pr-9 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl ${
              isClickable ? 'cursor-pointer' : ''
            }`}
          >
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12"
              style={{
                background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accentColor} 22%, transparent), transparent)`,
              }}
              initial={{ x: '-120%' }}
              animate={{ x: '420%' }}
              transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.15 }}
            />

            <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accentColor }} />

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                dismiss()
              }}
              className="absolute top-2 right-2 z-10 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>

            <div className="relative flex items-center gap-3">
              <NotificationAvatar businessName={businessName} imageUrl={imageUrl} videoUrl={videoUrl} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold tracking-wide uppercase" style={{ color: accentColor }}>
                  {businessName}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-zinc-100">{title}</p>
                <p className="mt-0.5 line-clamp-3 text-xs leading-snug whitespace-pre-line text-zinc-400">{message}</p>

                {isClickable ? (
                  <span
                    className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold"
                    style={{ color: accentColor }}
                  >
                    Tap to open card
                    <ChevronRight size={12} />
                  </span>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
