'use client'

import type { ProfileMediaFrame } from '@/lib/media/profileMediaFrame'
import { PositionedFeatureMedia } from '@/profile-app/components/PositionedFeatureMedia'
import { cn } from '@/utils/cn'

type FeaturedCardMediaProps = {
  src: string
  alt: string
  frame?: ProfileMediaFrame | null
  /** Wrapper classes (rounded corners, fixed height when unframed, etc.). */
  className?: string
  /** Classes for the unframed fallback img/video. */
  mediaClassName?: string
  video?: boolean
  /** Fixed-height fallback when no mediaFrame is saved (list cards). */
  unframedHeightClassName?: string
}

/**
 * Shared feature-image renderer for card-settings preview + public tabs.
 * With mediaFrame → object-fit / position / zoom / height from the editor.
 * Without → simple cover (or contain via mediaClassName) in a black frame.
 */
export function FeaturedCardMedia({
  src,
  alt,
  frame,
  className,
  mediaClassName,
  video = false,
  unframedHeightClassName = 'h-48',
}: FeaturedCardMediaProps) {
  const url = src.trim()
  if (!url) return null

  if (frame) {
    return (
      <div className={cn('w-full overflow-hidden bg-black', className)}>
        <PositionedFeatureMedia
          src={url}
          alt={alt}
          frame={frame}
          video={video}
          className={mediaClassName || 'h-full w-full object-contain object-center'}
        />
      </div>
    )
  }

  return (
    <div className={cn('relative w-full overflow-hidden bg-black', unframedHeightClassName, className)}>
      {video ? (
        <video
          src={url}
          className={mediaClassName || 'h-full w-full object-cover object-center'}
          muted
          loop
          autoPlay
          playsInline
          aria-label={alt}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className={mediaClassName || 'h-full w-full object-cover object-center'} />
      )}
    </div>
  )
}
