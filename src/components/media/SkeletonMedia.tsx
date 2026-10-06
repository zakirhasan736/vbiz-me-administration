'use client'

import { cn } from '@/utils/cn'
import { useCallback, useState, type ImgHTMLAttributes, type ReactNode, type VideoHTMLAttributes } from 'react'

export type MediaLoadStatus = 'loading' | 'loaded' | 'error'

function statusForSrc(src?: string | null): MediaLoadStatus {
  return src?.trim() ? 'loading' : 'loaded'
}

/** Track load state for a media URL; resets when `src` changes. */
export function useMediaLoadState(src?: string | null): {
  status: MediaLoadStatus
  loaded: boolean
  markLoaded: () => void
  markError: () => void
} {
  const [status, setStatus] = useState<MediaLoadStatus>(() => statusForSrc(src))
  const [trackedSrc, setTrackedSrc] = useState(src)

  // Reset when the URL changes — adjust during render (no effect setState).
  if (src !== trackedSrc) {
    setTrackedSrc(src)
    setStatus(statusForSrc(src))
  }

  const markLoaded = useCallback(() => setStatus('loaded'), [])
  const markError = useCallback(() => setStatus('error'), [])

  return {
    status,
    loaded: status === 'loaded' || status === 'error',
    markLoaded,
    markError,
  }
}

type SkeletonWaveProps = {
  className?: string
  label?: string
}

/** Wave shimmer block — uses the global `.skeleton` animation. */
export function SkeletonWave({ className, label = 'Loading media' }: SkeletonWaveProps) {
  return (
    <div
      className={cn('skeleton absolute inset-0 z-10', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  )
}

type SkeletonMediaShellProps = {
  className?: string
  /** When true, show the wave overlay. */
  loading?: boolean
  label?: string
  children?: ReactNode
}

/** Frame that overlays a wave skeleton until `loading` is false. */
export function SkeletonMediaShell({
  className,
  loading = true,
  label = 'Loading media',
  children,
}: SkeletonMediaShellProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {loading ? <SkeletonWave label={label} /> : null}
      {children}
    </div>
  )
}

type SkeletonImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'onLoad' | 'onError'> & {
  src?: string | null
  alt?: string
  /** Outer frame classes (positioning / size). */
  className?: string
  /** Applied to the `<img>`. */
  mediaClassName?: string
  /** Fill parent with absolute inset media. */
  fill?: boolean
  skeletonLabel?: string
}

/** Image with wave skeleton until decoded / painted. */
export function SkeletonImage({
  src,
  alt = '',
  className,
  mediaClassName,
  fill = false,
  skeletonLabel = 'Loading image',
  ...imgProps
}: SkeletonImageProps) {
  const url = src?.trim() || ''
  const { loaded, markLoaded, markError } = useMediaLoadState(url)

  if (!url) return null

  return (
    <div className={cn('relative overflow-hidden', fill && 'absolute inset-0 h-full w-full', className)}>
      {!loaded ? <SkeletonWave label={skeletonLabel} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN / S3 media */}
      <img
        {...imgProps}
        src={url}
        alt={alt}
        onLoad={markLoaded}
        onError={markError}
        className={cn(
          fill ? 'absolute inset-0 h-full w-full' : 'h-full w-full',
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          mediaClassName
        )}
      />
    </div>
  )
}

type SkeletonVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'onLoadedData' | 'onError'> & {
  src?: string | null
  className?: string
  mediaClassName?: string
  fill?: boolean
  skeletonLabel?: string
}

/** Video with wave skeleton until first frame is ready. */
export function SkeletonVideo({
  src,
  className,
  mediaClassName,
  fill = false,
  skeletonLabel = 'Loading video',
  ...videoProps
}: SkeletonVideoProps) {
  const url = src?.trim() || ''
  const { loaded, markLoaded, markError } = useMediaLoadState(url)

  if (!url) return null

  return (
    <div className={cn('relative overflow-hidden', fill && 'absolute inset-0 h-full w-full', className)}>
      {!loaded ? <SkeletonWave label={skeletonLabel} /> : null}
      <video
        {...videoProps}
        src={url}
        onLoadedData={markLoaded}
        onError={markError}
        className={cn(
          fill ? 'absolute inset-0 h-full w-full' : 'h-full w-full',
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          mediaClassName
        )}
      />
    </div>
  )
}
