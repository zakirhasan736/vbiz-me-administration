'use client'

import { isVideoUrl } from '@/lib/mediaUrl'
import { restoreCoverPlayback, saveCoverPlayback } from '@/profile-app/lib/profileCoverPlayback'
import Image from 'next/image'
import { memo, useEffect, useRef } from 'react'

type Props = {
  persistenceId: string
  coverVideoUrl?: string
  ownerName?: string
  isHeroLayout: boolean
}

/** Cover media — memoized; keeps playback position across section navigations. */
export const ProfileCoverMedia = memo(function ProfileCoverMedia({
  persistenceId,
  coverVideoUrl,
  ownerName,
  isHeroLayout,
}: Props) {
  const coverVideoRef = useRef<HTMLVideoElement>(null)
  const coverIsVideo = Boolean(coverVideoUrl?.trim() && isVideoUrl(coverVideoUrl))
  const src = coverVideoUrl?.trim() ?? ''
  const cacheKey = src ? `${persistenceId}:${src}` : ''

  useEffect(() => {
    if (!coverIsVideo || !cacheKey) return
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
  }, [coverIsVideo, cacheKey])

  if (!src) return null

  return (
    <div
      className={`vbiz-cover-video pointer-events-none absolute top-0 left-0 z-1 mt-0 w-full overflow-hidden ${isHeroLayout ? 'h-[70vh]' : 'h-[60vh]'}`}
    >
      {coverIsVideo ? (
        <video
          ref={coverVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover object-center opacity-100 brightness-105 filter"
          src={src}
        />
      ) : (
        <Image
          width={1000}
          height={1000}
          src={src}
          alt={ownerName ? `${ownerName} cover` : 'Cover'}
          className="h-full w-full object-cover object-center opacity-100 brightness-105 filter"
          priority
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-linear-to-t from-zinc-50 via-zinc-50/40 to-transparent dark:from-[#09090b] dark:via-[#09090b]/40" />
    </div>
  )
})
