'use client'

import { cn } from '@/utils/cn'

type FeatureMediaEmbedProps = {
  /** Player URL from resolveEmbedVideoUrl (YouTube / Vimeo). */
  embedUrl: string
  title: string
  className?: string
}

/**
 * YouTube / Vimeo feature media. These links are web pages, not video files, so a <video>
 * tag can't play them; owners who paste them as featured media get a real player instead.
 */
export function FeatureMediaEmbed({ embedUrl, title, className }: FeatureMediaEmbedProps) {
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-black', className)}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
