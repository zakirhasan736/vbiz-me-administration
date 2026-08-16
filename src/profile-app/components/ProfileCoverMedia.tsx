'use client'

import { resolveWallpaperConfig, wallpaperNeedsMedia } from '@/lib/theme/wallpaper'
import { ProfileWallpaperContent } from '@/profile-app/components/ProfileWallpaperContent'
import { restoreCoverPlayback, saveCoverPlayback } from '@/profile-app/lib/profileCoverPlayback'
import { DEFAULT_COVER } from '@/profile-app/profilePublicProps'
import { useProfileTheme } from '@/profile-app/providers/ProfileThemeProvider'
import { memo, useEffect, useRef, useState } from 'react'

type Props = {
  persistenceId: string
  coverVideoUrl?: string
  ownerName?: string
  isHeroLayout: boolean
}

/** Cover media — memoized; defers video buffering until visible; keeps playback position across navigations. */
export const ProfileCoverMedia = memo(function ProfileCoverMedia({
  persistenceId,
  coverVideoUrl,
  ownerName,
  isHeroLayout,
}: Props) {
  const theme = useProfileTheme()
  const wallpaper = resolveWallpaperConfig(theme?.themeConfig, coverVideoUrl, DEFAULT_COVER)
  const needsMedia = wallpaperNeedsMedia(wallpaper.style)
  const src = coverVideoUrl?.trim() ?? ''
  const isVideoStyle = wallpaper.style === 'video' || (wallpaper.style === 'blur' && Boolean(src))
  const cacheKey = needsMedia && src ? `${persistenceId}:${src}` : ''
  const containerRef = useRef<HTMLDivElement>(null)
  const coverVideoRef = useRef<HTMLVideoElement>(null)
  const [isVisible, setIsVisible] = useState(!(wallpaper.style === 'video' || wallpaper.style === 'blur'))

  useEffect(() => {
    if (!isVideoStyle || !needsMedia) {
      setIsVisible(true)
      return
    }
    const root = containerRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '80px' }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [isVideoStyle, needsMedia])

  useEffect(() => {
    if (wallpaper.style !== 'video' && wallpaper.style !== 'blur') return
    if (!cacheKey || !isVisible) return
    const el = coverVideoRef.current
    if (!el) return

    el.muted = true
    restoreCoverPlayback(cacheKey, el)

    const tryPlay = () => {
      if (el.paused) void el.play().catch(() => undefined)
    }

    tryPlay()
    el.addEventListener('canplay', tryPlay, { once: true })

    return () => {
      el.removeEventListener('canplay', tryPlay)
      saveCoverPlayback(cacheKey, el)
    }
  }, [wallpaper.style, cacheKey, isVisible])

  if (needsMedia && !src && (wallpaper.style === 'image' || wallpaper.style === 'video')) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`vbiz-cover-video pointer-events-none absolute top-0 left-0 z-1 mt-0 w-full overflow-hidden ${isHeroLayout ? 'h-[70vh]' : 'h-[60vh]'}`}
    >
      <ProfileWallpaperContent
        ref={coverVideoRef}
        wallpaper={wallpaper}
        mediaUrl={src}
        alt={ownerName ? `${ownerName} cover` : 'Cover'}
        deferVideo={wallpaper.style === 'video' || wallpaper.style === 'blur'}
        videoVisible={isVisible}
        mediaClassName="opacity-100 brightness-105"
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-zinc-50/25 via-zinc-50/5 to-transparent dark:from-[#09090b]/70 dark:via-[#09090b]/30 dark:to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-linear-to-t from-zinc-50/90 via-zinc-50/30 to-transparent dark:from-[#09090b] dark:via-[#09090b]/40" />
    </div>
  )
})
