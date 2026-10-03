'use client'

import { encodeMediaUrl, isVideoUrl } from '@/lib/mediaUrl'
import { isIosDevice, isSafariBrowser } from '@/lib/pwa/pwaInstallEnv'
import {
  patternBackgroundSize,
  resolveGradientCss,
  resolvePatternBackgroundLayers,
  wallpaperNeedsMedia,
  type CardWallpaperConfig,
  type WallpaperPatternId,
} from '@/lib/theme/wallpaper'
import {
  buildAdaptiveBackgroundVideoUrl,
  pickIntroQuality,
  readNetworkHints,
  withVideoStartHint,
} from '@/profile-app/lib/introVideoAdaptive'
import { cn } from '@/utils/cn'
import { forwardRef, useEffect, useMemo, useRef, type CSSProperties, type MutableRefObject } from 'react'

type Props = {
  wallpaper: CardWallpaperConfig
  /** Background Video/Image URL. Empty when the owner has not uploaded cover media. */
  mediaUrl?: string | null
  className?: string
  /** Applied to img/video elements (template opacity / blend). */
  mediaClassName?: string
  alt?: string
  /** When false, skip rendering media if URL empty (fill/gradient/pattern still render). */
  deferVideo?: boolean
  videoVisible?: boolean
}

function isCoarsePointerDevice() {
  if (typeof window === 'undefined') return false
  if (isIosDevice()) return true
  if (/Android/i.test(navigator.userAgent || '')) return true
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1
}

/**
 * Paints fill / gradient / pattern / blur / image / video inside a template cover slot.
 * Outer wrappers (fades, blends, z-index) stay with each template.
 */
export const ProfileWallpaperContent = forwardRef<HTMLVideoElement, Props>(function ProfileWallpaperContent(
  { wallpaper, mediaUrl, className, mediaClassName, alt = '', deferVideo = false, videoVisible = true },
  videoRef
) {
  const style = wallpaper.style
  const fillColor = wallpaper.fillColor || '#0a0a0a'
  const localVideoRef = useRef<HTMLVideoElement | null>(null)

  const setVideoRef = (node: HTMLVideoElement | null) => {
    localVideoRef.current = node
    if (typeof videoRef === 'function') videoRef(node)
    else if (videoRef) videoRef.current = node
  }

  if (style === 'fill') {
    return (
      <div
        className={cn('absolute inset-0 h-full w-full', className)}
        style={{ backgroundColor: fillColor }}
        aria-hidden
      />
    )
  }

  if (style === 'gradient') {
    return (
      <div
        className={cn('absolute inset-0 h-full w-full', className)}
        style={{ backgroundImage: resolveGradientCss(wallpaper) }}
        aria-hidden
      />
    )
  }

  if (style === 'pattern') {
    const patternId = (wallpaper.patternId || 'dots') as WallpaperPatternId
    const layers = resolvePatternBackgroundLayers(patternId, fillColor)
    const styleProps: CSSProperties = {
      backgroundColor: layers.backgroundColor,
      backgroundImage: layers.backgroundImage,
      backgroundSize: patternBackgroundSize(patternId),
    }
    return <div className={cn('absolute inset-0 h-full w-full', className)} style={styleProps} aria-hidden />
  }

  // image | video | blur
  if (!wallpaperNeedsMedia(style)) return null

  const src = encodeMediaUrl(mediaUrl?.trim() || '')
  if (!src) {
    return <div className={cn('absolute inset-0 h-full w-full bg-zinc-900', className)} aria-hidden />
  }

  const isBlur = style === 'blur'
  const treatAsVideo = style === 'video' || isVideoUrl(src) || (isBlur && isVideoUrl(src))
  const mediaClasses = cn(
    'absolute inset-0 h-full w-full object-cover',
    isBlur && 'scale-110 blur-md',
    mediaClassName,
    !isBlur && className
  )

  return (
    <WallpaperMedia
      treatAsVideo={treatAsVideo}
      deferVideo={deferVideo}
      videoVisible={videoVisible}
      src={src}
      alt={alt}
      isBlur={isBlur}
      className={className}
      mediaClasses={mediaClasses}
      setVideoRef={setVideoRef}
      localVideoRef={localVideoRef}
    />
  )
})

function WallpaperMedia({
  treatAsVideo,
  deferVideo,
  videoVisible,
  src,
  alt,
  isBlur,
  className,
  mediaClasses,
  setVideoRef,
  localVideoRef,
}: {
  treatAsVideo: boolean
  deferVideo: boolean
  videoVisible: boolean
  src: string
  alt: string
  isBlur: boolean
  className?: string
  mediaClasses: string
  setVideoRef: (node: HTMLVideoElement | null) => void
  localVideoRef: MutableRefObject<HTMLVideoElement | null>
}) {
  const adaptiveSrc = useMemo(() => {
    if (!treatAsVideo) return src
    const quality = pickIntroQuality(readNetworkHints(), {
      isMobile: isCoarsePointerDevice(),
      isSafari: isSafariBrowser() || isIosDevice(),
    })
    return withVideoStartHint(buildAdaptiveBackgroundVideoUrl(src, quality))
  }, [src, treatAsVideo])

  useEffect(() => {
    if (!treatAsVideo || (deferVideo && !videoVisible)) return
    const el = localVideoRef.current
    if (!el) return

    el.muted = true
    el.defaultMuted = true
    el.playsInline = true
    el.setAttribute('muted', '')
    el.setAttribute('playsinline', '')
    el.setAttribute('webkit-playsinline', 'true')

    const tryPlay = () => {
      if (el.paused) void el.play().catch(() => undefined)
    }

    try {
      el.load()
    } catch {
      /* ignore */
    }
    tryPlay()
    el.addEventListener('loadeddata', tryPlay)
    el.addEventListener('canplay', tryPlay)
    return () => {
      el.removeEventListener('loadeddata', tryPlay)
      el.removeEventListener('canplay', tryPlay)
    }
  }, [adaptiveSrc, deferVideo, localVideoRef, treatAsVideo, videoVisible])

  const media =
    treatAsVideo && deferVideo && !videoVisible ? (
      <div className="absolute inset-0 h-full w-full bg-zinc-200 dark:bg-zinc-900" aria-hidden />
    ) : treatAsVideo ? (
      <video
        ref={setVideoRef}
        src={adaptiveSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        className={mediaClasses}
        {...{
          'webkit-playsinline': 'true',
          'x5-playsinline': 'true',
        }}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={mediaClasses} />
    )

  // Clip filter:blur + scale so paint cannot escape the cover slot.
  if (isBlur) {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
        {media}
      </div>
    )
  }

  return media
}
