'use client'

import { encodeMediaUrl, isVideoUrl } from '@/lib/mediaUrl'
import { isIosDevice, isSafariBrowser } from '@/lib/pwa/pwaInstallEnv'
import { resolveAdaptiveBackgroundVideoSrc } from '@/profile-app/lib/introVideoAdaptive'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useProfileIntroContext } from '@/profile-app/providers/ProfileIntroProvider'
import { useEffect, useMemo, useState } from 'react'

function isCoarsePointerDevice() {
  if (typeof window === 'undefined') return false
  if (isIosDevice()) return true
  if (/Android/i.test(navigator.userAgent || '')) return true
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1
}

/**
 * Prefetches the home background video while the intro overlay is up so the
 * homescreen player can paint immediately on skip/done (HTTP + media cache warm).
 *
 * On Safari/iOS the warm element is kept briefly after intro ends — tearing it
 * down immediately was discarding the only buffered copy before home attached.
 */
export function BackgroundVideoWarmup() {
  const { homeMedia, embedded } = useProfileDisplay()
  const { showPreloader } = useProfileIntroContext()
  const raw = encodeMediaUrl(homeMedia.bgMedia?.trim() || '')
  const hasBgVideo = !embedded && Boolean(raw) && isVideoUrl(raw)
  const safariLike = isSafariBrowser() || isIosDevice()
  const [warmActive, setWarmActive] = useState(false)

  useEffect(() => {
    if (!hasBgVideo) {
      const clearId = window.setTimeout(() => setWarmActive(false), 0)
      return () => window.clearTimeout(clearId)
    }

    if (showPreloader) {
      const onId = window.setTimeout(() => setWarmActive(true), 0)
      return () => window.clearTimeout(onId)
    }

    // Intro done (or skipped): keep the warm element alive briefly for Safari handoff.
    const lingerMs = safariLike ? 10000 : 2500
    const onId = window.setTimeout(() => setWarmActive(true), 0)
    const offId = window.setTimeout(() => setWarmActive(false), lingerMs)
    return () => {
      window.clearTimeout(onId)
      window.clearTimeout(offId)
    }
  }, [hasBgVideo, safariLike, showPreloader])

  const shouldWarm = hasBgVideo && (showPreloader || warmActive)

  const warmSrc = useMemo(() => {
    if (!shouldWarm) return ''
    return resolveAdaptiveBackgroundVideoSrc(raw, {
      isMobile: isCoarsePointerDevice(),
      isSafari: safariLike,
    })
  }, [raw, safariLike, shouldWarm])

  useEffect(() => {
    if (!warmSrc) return
    const href = warmSrc.split('#')[0] || warmSrc

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = href
    link.type = 'video/mp4'
    document.head.appendChild(link)

    const video = document.createElement('video')
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('autoplay', '')
    video.src = warmSrc
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:0'
    document.body.appendChild(video)
    void video.play().catch(() => undefined)

    return () => {
      link.remove()
      // Pause + detach only — do not wipe src/load() (that clears Safari's buffer).
      video.pause()
      video.remove()
    }
  }, [warmSrc])

  return null
}
