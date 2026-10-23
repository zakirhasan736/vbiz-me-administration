'use client'

import { isVideoUrl } from '@/lib/mediaUrl'
import { resolveWallpaperConfig, wallpaperNeedsMedia } from '@/lib/theme/wallpaper'
import { ProfileWallpaperContent } from '@/profile-app/components/ProfileWallpaperContent'
import { HOME_MEDIA_SOUND_EVENT, type HomeMediaSoundDetail } from '@/profile-app/lib/homeMediaSound'
import { restoreCoverPlayback, saveCoverPlayback } from '@/profile-app/lib/profileCoverPlayback'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useProfileIntroContextOptional } from '@/profile-app/providers/ProfileIntroProvider'
import { useProfileTheme } from '@/profile-app/providers/ProfileThemeProvider'
import { memo, useEffect, useRef } from 'react'

type Props = {
  persistenceId: string
  coverVideoUrl?: string
  ownerName?: string
  isHeroLayout: boolean
}

/**
 * Cover media — always mounts the video immediately (no intersection defer) so
 * buffering can finish during intro and play the moment home is visible.
 */
export const ProfileCoverMedia = memo(function ProfileCoverMedia({
  persistenceId,
  coverVideoUrl,
  ownerName,
  isHeroLayout,
}: Props) {
  const theme = useProfileTheme()
  const { field, design } = useProfileDisplay()
  const preferSound = Boolean(useProfileIntroContextOptional()?.homeMediaSoundUnlocked)
  const wallpaper = resolveWallpaperConfig(theme?.themeConfig, coverVideoUrl)
  const needsMedia = wallpaperNeedsMedia(wallpaper.style)
  const src = coverVideoUrl?.trim() ?? ''
  const mediaFrame = field('Background Video/Image').mediaFrame
  const isVideo = Boolean(src) && (wallpaper.style === 'video' || wallpaper.style === 'blur' || isVideoUrl(src))
  const cacheKey = needsMedia && src ? `${persistenceId}:${src}` : ''
  const coverVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!isVideo || !cacheKey) return
    const el = coverVideoRef.current
    if (!el) return

    let soundBlocked = false
    let gestureUnlocked = preferSound
    const wantSound = () => (preferSound || gestureUnlocked) && !soundBlocked

    const applyMute = (withSound: boolean) => {
      el.playsInline = true
      if (withSound) {
        el.muted = false
        el.defaultMuted = false
        el.removeAttribute('muted')
        if (el.volume === 0) el.volume = 0.7
      } else {
        el.muted = true
        el.defaultMuted = true
        el.setAttribute('muted', '')
      }
    }

    applyMute(wantSound())
    restoreCoverPlayback(cacheKey, el)

    const tryPlay = () => {
      applyMute(wantSound())
      if (!el.paused) return
      void el.play().catch(() => {
        if (wantSound()) {
          soundBlocked = true
          applyMute(false)
          void el.play().catch(() => undefined)
        }
      })
    }

    const onSoundPreference = (event: Event) => {
      const detail = (event as CustomEvent<HomeMediaSoundDetail>).detail
      gestureUnlocked = Boolean(detail?.unlocked)
      soundBlocked = false
      if (!gestureUnlocked) {
        applyMute(false)
        return
      }
      applyMute(true)
      void el.play().catch(() => {
        soundBlocked = true
        applyMute(false)
        void el.play().catch(() => undefined)
      })
    }

    // Do not call el.load() — it aborts in-flight buffers from warmup / first mount.
    tryPlay()
    el.addEventListener('loadedmetadata', tryPlay)
    el.addEventListener('loadeddata', tryPlay)
    el.addEventListener('canplay', tryPlay)
    window.addEventListener(HOME_MEDIA_SOUND_EVENT, onSoundPreference)

    return () => {
      el.removeEventListener('loadedmetadata', tryPlay)
      el.removeEventListener('loadeddata', tryPlay)
      el.removeEventListener('canplay', tryPlay)
      window.removeEventListener(HOME_MEDIA_SOUND_EVENT, onSoundPreference)
      saveCoverPlayback(cacheKey, el)
    }
  }, [cacheKey, isVideo, preferSound])

  if (needsMedia && !src && (wallpaper.style === 'image' || wallpaper.style === 'video')) {
    return null
  }

  return (
    <div
      className={`vbiz-cover-video pointer-events-none absolute top-0 left-0 z-1 mt-0 w-full overflow-hidden ${isHeroLayout ? 'h-[70vh]' : 'h-[60vh]'}`}
    >
      <ProfileWallpaperContent
        ref={coverVideoRef}
        wallpaper={wallpaper}
        mediaUrl={src}
        mediaFrame={mediaFrame}
        accentColor={design?.accentColor}
        alt={ownerName ? `${ownerName} cover` : 'Cover'}
        deferVideo={false}
        videoVisible
        mediaClassName={mediaFrame ? 'opacity-100 brightness-105' : 'object-cover opacity-100 brightness-105'}
      />
    </div>
  )
})
