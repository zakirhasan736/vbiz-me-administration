'use client'

import { isVideoUrl } from '@/lib/mediaUrl'
import { restoreCoverPlayback, saveCoverPlayback } from '@/profile-app/lib/profileCoverPlayback'
import Image from 'next/image'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const coverVideoRef = useRef<HTMLVideoElement>(null)
  const coverIsVideo = Boolean(coverVideoUrl?.trim() && isVideoUrl(coverVideoUrl))
  const src = coverVideoUrl?.trim() ?? ''
  const cacheKey = src ? `${persistenceId}:${src}` : ''
  const [isVisible, setIsVisible] = useState(!coverIsVideo)

  useEffect(() => {
    if (!coverIsVideo) return
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
  }, [coverIsVideo])

  useEffect(() => {
    if (!coverIsVideo || !cacheKey || !isVisible) return
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
  }, [coverIsVideo, cacheKey, isVisible])

  if (!src) return null

  return (
    <div
      ref={containerRef}
      className={`vbiz-cover-video pointer-events-none absolute top-0 left-0 z-1 mt-0 w-full overflow-hidden ${isHeroLayout ? 'h-[70vh]' : 'h-[60vh]'}`}
    >
      {coverIsVideo ? (
        isVisible ? (
          <video
            ref={coverVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover object-center opacity-100 brightness-105 filter"
            src={src}
          />
        ) : (
          <div className="h-full w-full bg-zinc-200 dark:bg-zinc-900" aria-hidden />
        )
      ) : (
        <Image
          width={1000}
          height={1000}
          src={src}
          alt={ownerName ? `${ownerName} cover` : 'Cover'}
          className="h-full w-full object-cover object-center opacity-100 brightness-105 filter"
          loading="lazy"
          sizes="100vw"
        />
      )}
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-zinc-50/25 via-zinc-50/5 to-transparent dark:from-[#09090b]/70 dark:via-[#09090b]/30 dark:to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-linear-to-t from-zinc-50/90 via-zinc-50/30 to-transparent dark:from-[#09090b] dark:via-[#09090b]/40" />
    </div>
  )
})
