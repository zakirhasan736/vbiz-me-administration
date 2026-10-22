'use client'

import {
  parseProfileMediaFrame,
  profileFeatureMediaAspectRatio,
  profileMediaCoverLayoutStyle,
  profileMediaFitStyle,
  type MediaPixelSize,
  type ProfileMediaFrame,
} from '@/lib/media/profileMediaFrame'
import { isVideoUrl } from '@/lib/mediaUrl'
import { useEffect, useRef, useState } from 'react'

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
 * cover position / zoom / object-fit / height as the card builder.
 */
export function PositionedFeatureMedia({ src, alt, frame, className, video = false }: PositionedFeatureMediaProps) {
  const playVideo = video || isVideoUrl(src)
  const boxRef = useRef<HTMLDivElement>(null)
  const [mediaSizeState, setMediaSizeState] = useState<{ src: string; size: MediaPixelSize | null }>({
    src,
    size: null,
  })
  const [boxSize, setBoxSize] = useState<MediaPixelSize | null>(null)

  // Reset measured pixels when the media URL changes (render-time, not an effect).
  if (mediaSizeState.src !== src) {
    setMediaSizeState({ src, size: null })
  }
  const mediaSize = mediaSizeState.src === src ? mediaSizeState.size : null
  const setMediaSize = (size: MediaPixelSize) => setMediaSizeState({ src, size })
  const resolved = frame ? parseProfileMediaFrame(frame) : null

  useEffect(() => {
    if (!resolved) return
    const box = boxRef.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const sync = () => {
      const rect = box.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setBoxSize({ width: rect.width, height: rect.height })
      }
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(box)
    return () => observer.disconnect()
  }, [resolved])

  if (!resolved) {
    if (playVideo) {
      return <video src={src} className={className} controls playsInline preload="metadata" aria-label={alt} />
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    )
  }

  const fit =
    mediaSize && boxSize
      ? profileMediaCoverLayoutStyle(resolved, mediaSize, boxSize)
      : { ...profileMediaFitStyle(resolved), width: '100%', height: '100%' }

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ aspectRatio: profileFeatureMediaAspectRatio(resolved) }}
    >
      {playVideo ? (
        <video
          src={src}
          className="pointer-events-none"
          style={fit}
          muted
          loop
          autoPlay
          playsInline
          aria-label={alt}
          onLoadedMetadata={(event) => {
            const videoEl = event.currentTarget
            if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
              setMediaSize({ width: videoEl.videoWidth, height: videoEl.videoHeight })
            }
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="pointer-events-none"
          style={fit}
          onLoad={(event) => {
            const image = event.currentTarget
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
              setMediaSize({ width: image.naturalWidth, height: image.naturalHeight })
            }
          }}
        />
      )}
    </div>
  )
}
