'use client'

import {
  parseProfileMediaFrame,
  profileFeatureMediaAspectRatio,
  profileMediaCoverLayoutStyle,
  profileMediaFramedObjectFitStyle,
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
 * Featured / services media frame.
 * Contain → black frame under the image (CSS object-fit contain, centered).
 * Cover → pixel pan/zoom. Height controls the frame aspect ratio.
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
  const useCoverMath = Boolean(resolved && (resolved.objectFit || 'cover') === 'cover')

  useEffect(() => {
    if (!resolved || !useCoverMath) return
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
  }, [resolved, useCoverMath])

  if (!resolved) {
    if (playVideo) {
      return <video src={src} className={className} controls playsInline preload="metadata" aria-label={alt} />
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    )
  }

  // Contain / fill / none / scale-down: fill the black frame with CSS object-fit (letterbox).
  // Cover: pixel-accurate pan + zoom once media + box sizes are known.
  const fit =
    useCoverMath && mediaSize && boxSize
      ? profileMediaCoverLayoutStyle(resolved, mediaSize, boxSize)
      : profileMediaFramedObjectFitStyle(resolved)

  return (
    <div
      ref={boxRef}
      className="vbiz-feature-media relative w-full overflow-hidden bg-black"
      style={{ aspectRatio: profileFeatureMediaAspectRatio(resolved) }}
      data-object-fit={resolved.objectFit || 'cover'}
    >
      {playVideo ? (
        <video
          src={src}
          className="vbiz-feature-media-img pointer-events-none"
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
          className="vbiz-feature-media-img pointer-events-none"
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
