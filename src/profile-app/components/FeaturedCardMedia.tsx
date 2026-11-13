'use client'

import { isDirectVideoUrl, resolveEmbedVideoUrl } from '@/lib/media/pastedMediaUrl'
import type { ProfileMediaFrame } from '@/lib/media/profileMediaFrame'
import { FeatureMediaEmbed } from '@/profile-app/components/FeatureMediaEmbed'
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

  // Pasted YouTube / Vimeo links need a player, not <video>.
  const embedUrl = resolveEmbedVideoUrl(url)
  if (embedUrl) {
    return <FeatureMediaEmbed embedUrl={embedUrl} title={alt} className={className} />
  }
  // Many sections don't pass `video`; a pasted .mp4/.webm must still play, not render as <img>.
  const playVideo = video || isDirectVideoUrl(url)

  if (frame) {
    return (
      <div className={cn('w-full overflow-hidden bg-black', className)}>
        <PositionedFeatureMedia
          src={url}
          alt={alt}
          frame={frame}
          video={playVideo}
          className={mediaClassName || 'h-full w-full object-contain object-center'}
        />
      </div>
    )
  }

  return (
    <div className={cn('relative w-full overflow-hidden bg-black', unframedHeightClassName, className)}>
      {playVideo ? (
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
