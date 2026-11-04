import type { CSSProperties } from 'react'

/** How the image fills the featured / avatar frame on the public card. */
export type ProfileMediaObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

export const PROFILE_MEDIA_OBJECT_FIT_OPTIONS: Array<{ value: ProfileMediaObjectFit; label: string }> = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Fill' },
  { value: 'scale-down', label: 'Scale down' },
  { value: 'none', label: 'None' },
]

/** Crop for the Personal avatar image or video. Persisted on the Profile Image/Video field. */
export type ProfileMediaFrame = {
  /** 0 = left edge, 50 = center, 100 = right edge. */
  focusX: number
  /** 0 = top, 50 = center, 100 = bottom. */
  focusY: number
  /** 1 = cover the frame; lower zooms out, higher zooms in. */
  zoom: number
  /** 1 = default portrait / feature height. Higher makes the frame taller. */
  height: number
  /** How the media fills the frame. Default cover (or contain when zoomed out below 1). */
  objectFit?: ProfileMediaObjectFit
}

export type MediaPixelSize = { width: number; height: number }

export const DEFAULT_PROFILE_MEDIA_FRAME: ProfileMediaFrame = {
  focusX: 50,
  focusY: 0,
  zoom: 1,
  height: 1,
}

/** Featured cards start centered until the user drags. */
export const DEFAULT_FEATURE_MEDIA_FRAME: ProfileMediaFrame = {
  focusX: 50,
  focusY: 50,
  zoom: 1,
  height: 1,
}

/** Allow zoom-out below cover (100%) and zoom-in above it. */
export const PROFILE_FRAME_ZOOM_MIN = 0.5
export const PROFILE_FRAME_ZOOM_MAX = 2.5
export const PROFILE_FRAME_HEIGHT_MIN = 0.7
export const PROFILE_FRAME_HEIGHT_MAX = 1.6
export const PROFILE_FRAME_PREVIEW_BASE_PX = 300
/** Public featured media default height before the height multiplier. */
export const FEATURE_MEDIA_BASE_HEIGHT_PX = 280

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function readNumber(value: unknown, fallback: number, min: number, max: number, decimals = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  const factor = 10 ** decimals
  return clamp(Math.round(n * factor) / factor, min, max)
}

function readObjectFit(value: unknown, fallback: ProfileMediaObjectFit = 'cover'): ProfileMediaObjectFit {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim().toLowerCase()
  if (
    trimmed === 'cover' ||
    trimmed === 'contain' ||
    trimmed === 'fill' ||
    trimmed === 'none' ||
    trimmed === 'scale-down'
  ) {
    return trimmed
  }
  return fallback
}

/** Null when nothing was saved, so public cards keep their original fit. */
export function readOptionalMediaFrame(value: unknown): ProfileMediaFrame | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '[object Object]') return null
    try {
      return readOptionalMediaFrame(JSON.parse(trimmed))
    } catch {
      return null
    }
  }
  if (typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  if (raw.focusX == null && raw.focusY == null && raw.zoom == null && raw.height == null && raw.objectFit == null) {
    return null
  }
  return parseProfileMediaFrame(value)
}

export function parseProfileMediaFrame(value: unknown): ProfileMediaFrame {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PROFILE_MEDIA_FRAME }
  const raw = value as Record<string, unknown>
  const hasObjectFit = typeof raw.objectFit === 'string' && Boolean(raw.objectFit.trim())
  return {
    focusX: readNumber(raw.focusX, DEFAULT_PROFILE_MEDIA_FRAME.focusX, 0, 100),
    focusY: readNumber(raw.focusY, DEFAULT_PROFILE_MEDIA_FRAME.focusY, 0, 100),
    zoom: readNumber(raw.zoom, DEFAULT_PROFILE_MEDIA_FRAME.zoom, PROFILE_FRAME_ZOOM_MIN, PROFILE_FRAME_ZOOM_MAX, 2),
    height: readNumber(
      raw.height,
      DEFAULT_PROFILE_MEDIA_FRAME.height,
      PROFILE_FRAME_HEIGHT_MIN,
      PROFILE_FRAME_HEIGHT_MAX,
      2
    ),
    ...(hasObjectFit ? { objectFit: readObjectFit(raw.objectFit) } : {}),
  }
}

export function profileMediaObjectPosition(frame: ProfileMediaFrame): string {
  return `${frame.focusX}% ${frame.focusY}%`
}

/** Resolved object-fit: explicit choice, else contain when zoomed out, else cover. */
export function resolveProfileMediaObjectFit(frame: ProfileMediaFrame): ProfileMediaObjectFit {
  if (frame.objectFit) return frame.objectFit
  return frame.zoom < 1 ? 'contain' : 'cover'
}

/** Display value for the object-type dropdown (defaults to cover when unset). */
export function profileMediaObjectFitSelectValue(frame: ProfileMediaFrame): ProfileMediaObjectFit {
  return frame.objectFit || 'cover'
}

/** Object types that must stay fully inside the frame (no zoom overflow). */
export function isContainedObjectFit(fit: ProfileMediaObjectFit | undefined): boolean {
  return fit === 'contain' || fit === 'scale-down'
}

/** Contain drag stays locked at 100% zoom and unlocks after zoom in or zoom out. */
export function containedFitDragUnlocked(frame: ProfileMediaFrame): boolean {
  return isContainedObjectFit(frame.objectFit) && frame.zoom !== 1
}

/** Tailwind object-* class matching a saved mediaFrame (avoids object-cover fighting contain). */
export function featureMediaObjectClassName(frame?: ProfileMediaFrame | null, fallback = 'object-cover'): string {
  if (!frame) return fallback
  const fit = frame.objectFit || resolveProfileMediaObjectFit(frame)
  if (fit === 'contain') return 'object-contain'
  if (fit === 'scale-down') return 'object-scale-down'
  if (fit === 'fill') return 'object-fill'
  if (fit === 'none') return 'object-none'
  return 'object-cover'
}

/**
 * Inline styles for feature images in list/detail cards (preview + public).
 * Prefer `PositionedFeatureMedia` / `FeaturedCardMedia` when the frame owns layout height.
 * Contain / fill never apply zoom scale (that made contain look like cover).
 * Cover keeps object-position + optional zoom scale as a CSS approximation.
 */
export function profileMediaFitStyle(frame: ProfileMediaFrame): {
  objectFit: ProfileMediaObjectFit
  objectPosition: string
  transform: string
  transformOrigin: string
} {
  const objectPosition = profileMediaObjectPosition(frame)
  const explicit = frame.objectFit
  const objectFit = explicit || resolveProfileMediaObjectFit(frame)

  if (isContainedObjectFit(objectFit)) {
    const zoomed = containedFitDragUnlocked(frame)
    return {
      objectFit,
      // 100% contain leaves object-position unset. Zoom unlocks drag via focus.
      objectPosition: zoomed ? objectPosition : 'unset',
      transform: zoomed ? `scale(${frame.zoom})` : 'none',
      transformOrigin: zoomed ? objectPosition : 'center',
    }
  }

  if (objectFit === 'fill') {
    return {
      objectFit,
      objectPosition,
      transform: 'none',
      transformOrigin: '50% 50%',
    }
  }

  return {
    objectFit,
    objectPosition,
    transform: frame.zoom === 1 ? 'none' : `scale(${frame.zoom})`,
    transformOrigin: objectPosition,
  }
}

/**
 * Switch to contain / scale-down. Zoom and frame height stay.
 * Drag stays locked until zoom leaves 100%, then focus pans the image.
 */
export function resetFrameForContainedFit(
  fit: 'contain' | 'scale-down',
  current?: ProfileMediaFrame | null
): ProfileMediaFrame {
  const base = current ? parseProfileMediaFrame(current) : parseProfileMediaFrame(null)
  return parseProfileMediaFrame({
    ...base,
    objectFit: fit,
  })
}

/**
 * True CSS object-fit inside the full frame (black letterbox shows through).
 * - contain / scale-down at 100%: width/height 100%, object-position unset, drag ignored
 * - contain / scale-down zoomed: same box, object-position follows drag (top/bottom and left/right)
 * - fill: stretch to frame edges
 * - none: intrinsic size, clipped by the frame; zoom allowed
 */
export function profileMediaFramedObjectFitStyle(frame: ProfileMediaFrame): CSSProperties {
  const objectPosition = profileMediaObjectPosition(frame)
  const objectFit = frame.objectFit || resolveProfileMediaObjectFit(frame)

  if (isContainedObjectFit(objectFit)) {
    const zoomed = containedFitDragUnlocked(frame)
    return {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit,
      objectPosition: zoomed ? objectPosition : 'unset',
      transform: zoomed ? `scale(${frame.zoom})` : 'none',
      transformOrigin: zoomed ? objectPosition : 'center',
    }
  }

  if (objectFit === 'fill') {
    return {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'fill',
      objectPosition,
      transform: 'none',
    }
  }

  // none — natural pixels; frame clips overflow. Zoom still allowed.
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'none',
    objectPosition,
    transform: frame.zoom === 1 ? 'none' : `scale(${frame.zoom})`,
    transformOrigin: objectPosition,
  }
}

/**
 * Pixel-accurate cover / pan / zoom so left–right and top–bottom both move the image.
 * - cover (default): zoom 1 fills the frame (may crop); below 1 zooms out; above 1 zooms in
 * - contain / fill / none / scale-down: full-frame CSS object-fit so the black frame
 *   letterboxes under the image (centered), with zoom + object-position still applied
 * Focus 0–100 places that point at the center of the visible frame.
 */
export function profileMediaCoverLayoutStyle(
  frame: ProfileMediaFrame,
  media: MediaPixelSize,
  container: MediaPixelSize
): CSSProperties {
  if (media.width <= 0 || media.height <= 0 || container.width <= 0 || container.height <= 0) {
    return profileMediaFramedObjectFitStyle(frame)
  }

  // Explicit non-cover types → CSS object-fit inside the full frame (letterbox / pillarbox).
  // Unset objectFit keeps cover pan/zoom math (zoom < 1 = zoom out from cover).
  const fit = frame.objectFit || 'cover'
  if (fit === 'contain' || fit === 'scale-down') {
    if (frame.zoom === 1) return profileMediaFramedObjectFitStyle({ ...frame, objectFit: fit })
    const contain = Math.min(container.width / media.width, container.height / media.height)
    const scale = contain * frame.zoom
    const renderW = media.width * scale
    const renderH = media.height * scale
    return {
      position: 'absolute',
      width: renderW,
      height: renderH,
      left: container.width / 2 - (frame.focusX / 100) * renderW,
      top: container.height / 2 - (frame.focusY / 100) * renderH,
      maxWidth: 'none',
      objectFit: 'fill',
    }
  }
  if (fit !== 'cover') {
    return profileMediaFramedObjectFitStyle({ ...frame, objectFit: fit })
  }

  const cover = Math.max(container.width / media.width, container.height / media.height)
  const scale = cover * frame.zoom
  const renderW = media.width * scale
  const renderH = media.height * scale
  const left = container.width / 2 - (frame.focusX / 100) * renderW
  const top = container.height / 2 - (frame.focusY / 100) * renderH

  return {
    position: 'absolute',
    width: renderW,
    height: renderH,
    left,
    top,
    maxWidth: 'none',
    objectFit: 'fill',
  }
}

export function profileFramePreviewHeight(frame: ProfileMediaFrame): number {
  return Math.round(PROFILE_FRAME_PREVIEW_BASE_PX * frame.height)
}

/** Featured preview / public card: landscape box scaled by height (1 = 16:9). */
export function profileFeatureMediaAspectRatio(frame: ProfileMediaFrame): string {
  const height = Math.round(9 * frame.height * 100) / 100
  return `16 / ${height}`
}

/** Pixel max-height for public feature media when a fixed height box is preferred. */
export function profileFeatureMediaMaxHeight(frame: ProfileMediaFrame, basePx = FEATURE_MEDIA_BASE_HEIGHT_PX): number {
  return Math.round(basePx * frame.height)
}

/** Phone hero box. Default height 1 matches the existing 4 / 4.5 portrait. */
export function profileFramePhoneAspect(frame: ProfileMediaFrame): string {
  const height = Math.round(4.5 * frame.height * 100) / 100
  return `4 / ${height}`
}

export function profileFrameDesktopHeight(frame: ProfileMediaFrame, base = 320): number {
  return Math.round(base * frame.height)
}
