'use client'

import { isVideoUrl } from '@/lib/mediaUrl'
import { resolveWallpaperConfig, wallpaperNeedsMedia } from '@/lib/theme/wallpaper'
import { ProfileWallpaperContent } from '@/profile-app/components/ProfileWallpaperContent'
import { restoreCoverPlayback, saveCoverPlayback } from '@/profile-app/lib/profileCoverPlayback'
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
  const wallpaper = resolveWallpaperConfig(theme?.themeConfig, coverVideoUrl)
  const needsMedia = wallpaperNeedsMedia(wallpaper.style)
  const src = coverVideoUrl?.trim() ?? ''
  const isVideo = Boolean(src) && (wallpaper.style === 'video' || wallpaper.style === 'blur' || isVideoUrl(src))
  const cacheKey = needsMedia && src ? `${persistenceId}:${src}` : ''
  const coverVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!isVideo || !cacheKey) return
    const el = coverVideoRef.current
    if (!el) return

    el.muted = true
    el.defaultMuted = true
    el.playsInline = true
    restoreCoverPlayback(cacheKey, el)

    const tryPlay = () => {
      if (el.paused) void el.play().catch(() => undefined)
    }

    // Do not call el.load() — it aborts in-flight buffers from warmup / first mount.
    tryPlay()
    el.addEventListener('loadedmetadata', tryPlay)
    el.addEventListener('loadeddata', tryPlay)
    el.addEventListener('canplay', tryPlay)

    return () => {
      el.removeEventListener('loadedmetadata', tryPlay)
      el.removeEventListener('loadeddata', tryPlay)
      el.removeEventListener('canplay', tryPlay)
      saveCoverPlayback(cacheKey, el)
    }
  }, [cacheKey, isVideo])

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
        alt={ownerName ? `${ownerName} cover` : 'Cover'}
        deferVideo={false}
        videoVisible
        mediaClassName="opacity-100 brightness-105"
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-zinc-50/25 via-zinc-50/5 to-transparent dark:from-[#09090b]/70 dark:via-[#09090b]/30 dark:to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-linear-to-t from-zinc-50/90 via-zinc-50/30 to-transparent dark:from-[#09090b] dark:via-[#09090b]/40" />
    </div>
  )
})
