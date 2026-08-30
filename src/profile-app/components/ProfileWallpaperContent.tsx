'use client'

import { encodeMediaUrl, isVideoUrl } from '@/lib/mediaUrl'
import {
  patternBackgroundSize,
  resolveGradientCss,
  resolvePatternBackgroundLayers,
  wallpaperNeedsMedia,
  type CardWallpaperConfig,
  type WallpaperPatternId,
} from '@/lib/theme/wallpaper'
import { cn } from '@/utils/cn'
import { forwardRef, type CSSProperties } from 'react'

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

  const media =
    treatAsVideo && deferVideo && !videoVisible ? (
      <div className="absolute inset-0 h-full w-full bg-zinc-200 dark:bg-zinc-900" aria-hidden />
    ) : treatAsVideo ? (
      <video ref={videoRef} src={src} autoPlay loop muted playsInline preload="metadata" className={mediaClasses} />
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
})
