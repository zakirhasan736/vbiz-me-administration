import type { CSSProperties } from 'react'

/** Crop for the Personal avatar image or video. Persisted on the Profile Image/Video field. */
export type ProfileMediaFrame = {
  /** 0 = left edge, 50 = center, 100 = right edge. */
  focusX: number
  /** 0 = top, 50 = center, 100 = bottom. */
  focusY: number
  /** 1 = cover the frame; lower zooms out, higher zooms in. */
  zoom: number
  /** 1 = default portrait height. Higher makes the frame taller. */
  height: number
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function readNumber(value: unknown, fallback: number, min: number, max: number, decimals = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  const factor = 10 ** decimals
  return clamp(Math.round(n * factor) / factor, min, max)
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
  if (raw.focusX == null && raw.focusY == null && raw.zoom == null && raw.height == null) return null
  return parseProfileMediaFrame(value)
}

export function parseProfileMediaFrame(value: unknown): ProfileMediaFrame {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PROFILE_MEDIA_FRAME }
  const raw = value as Record<string, unknown>
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
  }
}

export function profileMediaObjectPosition(frame: ProfileMediaFrame): string {
  return `${frame.focusX}% ${frame.focusY}%`
}

/**
 * CSS fallback when media/container pixels are unknown.
 * Prefer `profileMediaCoverLayoutStyle` in interactive previews and public feature media.
 */
export function profileMediaFitStyle(frame: ProfileMediaFrame): {
  objectFit: 'cover' | 'contain'
  objectPosition: string
  transform: string
  transformOrigin: string
} {
  const objectPosition = profileMediaObjectPosition(frame)
  if (frame.zoom < 1) {
    return {
      objectFit: 'contain',
      objectPosition,
      transform: `scale(${frame.zoom})`,
      transformOrigin: objectPosition,
    }
  }
  return {
    objectFit: 'cover',
    objectPosition,
    transform: frame.zoom === 1 ? 'none' : `scale(${frame.zoom})`,
    transformOrigin: objectPosition,
  }
}

/**
 * Pixel-accurate cover / pan / zoom so left–right and top–bottom both move the image.
 * `zoom` 1 = cover the frame; below 1 zooms out (letterbox ok); above 1 zooms in.
 * Focus 0–100 places that point at the center of the visible frame.
 */
export function profileMediaCoverLayoutStyle(
  frame: ProfileMediaFrame,
  media: MediaPixelSize,
  container: MediaPixelSize
): CSSProperties {
  if (media.width <= 0 || media.height <= 0 || container.width <= 0 || container.height <= 0) {
    return {
      ...profileMediaFitStyle(frame),
      width: '100%',
      height: '100%',
    }
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

/** Phone hero box. Default height 1 matches the existing 4 / 4.5 portrait. */
export function profileFramePhoneAspect(frame: ProfileMediaFrame): string {
  const height = Math.round(4.5 * frame.height * 100) / 100
  return `4 / ${height}`
}

export function profileFrameDesktopHeight(frame: ProfileMediaFrame, base = 320): number {
  return Math.round(base * frame.height)
}
