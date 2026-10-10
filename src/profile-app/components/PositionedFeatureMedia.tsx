'use client'

import { profileMediaFitStyle, type ProfileMediaFrame } from '@/lib/media/profileMediaFrame'
import { isVideoUrl } from '@/lib/mediaUrl'

type PositionedFeatureMediaProps = {
  src: string
  alt: string
  frame?: ProfileMediaFrame | null
  /** Classes used when the visitor has not saved a crop. */
  className: string
  video?: boolean
}

/**
 * Shows the original image until a crop is saved. A saved crop uses the same
 * cover position as the card builder drag preview.
 */
export function PositionedFeatureMedia({ src, alt, frame, className, video = false }: PositionedFeatureMediaProps) {
  const playVideo = video || isVideoUrl(src)
  if (!frame) {
    if (playVideo) {
      return <video src={src} className={className} controls playsInline preload="metadata" aria-label={alt} />
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    )
  }

  const fit = profileMediaFitStyle(frame)
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      {playVideo ? (
        <video
          src={src}
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={fit}
          muted
          loop
          autoPlay
          playsInline
          aria-label={alt}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} draggable={false} className="absolute inset-0 h-full w-full" style={fit} />
      )}
    </div>
  )
}
