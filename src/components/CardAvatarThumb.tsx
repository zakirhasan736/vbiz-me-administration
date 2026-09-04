'use client'

import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { cn } from '@/utils/cn'

type CardAvatarThumbProps = {
  src?: string | null
  name?: string | null
  className?: string
  mediaClassName?: string
  size?: number
  /** Force video rendering (e.g. blob: preview from a video file). */
  forceVideo?: boolean
}

function initialFromName(name?: string | null): string {
  const trimmed = name?.trim() || ''
  if (!trimmed) return 'P'
  return trimmed[0]?.toUpperCase() || 'P'
}

/** True for stored avatar videos — does not treat bare blob: as video. */
export function isAvatarVideoSrc(url: string): boolean {
  return isVideoUrl(url)
}

/** Compact avatar for card grids / settings — image, looping video, or name initial. */
export function CardAvatarThumb({
  src,
  name,
  className,
  mediaClassName,
  size = 40,
  forceVideo = false,
}: CardAvatarThumbProps) {
  const initial = initialFromName(name)
  const url = src?.trim() || ''
  const shellClass = cn(
    'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 text-base font-black text-indigo-600 shadow-inner dark:border-white/5 dark:bg-slate-900 dark:text-indigo-400',
    className
  )
  const mediaClass = cn('h-full w-full object-cover', mediaClassName)

  if (!url) {
    return (
      <div className={shellClass} style={{ width: size, height: size }} aria-hidden>
        {initial}
      </div>
    )
  }

  if (forceVideo || isAvatarVideoSrc(url)) {
    return (
      <div className={shellClass} style={{ width: size, height: size }}>
        <video
          src={url.startsWith('blob:') || url.startsWith('data:') ? url : encodeMediaUrl(url)}
          className={mediaClass}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          aria-label={name ? `${name} avatar video` : 'Avatar video'}
        />
      </div>
    )
  }

  if (!isUsableImageSrc(url) && !url.startsWith('blob:')) {
    return (
      <div className={shellClass} style={{ width: size, height: size }} aria-hidden>
        {initial}
      </div>
    )
  }

  return (
    <div className={shellClass} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote S3 / CDN avatars */}
      <img
        src={url.startsWith('blob:') || url.startsWith('data:') ? url : encodeMediaUrl(url)}
        alt={name ? `${name} avatar` : 'Avatar'}
        className={mediaClass}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
