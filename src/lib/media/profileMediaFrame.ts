/** Crop for the Personal avatar image or video. Persisted on the Profile Image/Video field. */
export type ProfileMediaFrame = {
  /** 0 = left edge, 50 = center, 100 = right edge. */
  focusX: number
  /** 0 = top, 50 = center, 100 = bottom. */
  focusY: number
  /** 1 = fit the frame, higher values zoom in. */
  zoom: number
  /** 1 = default portrait height. Higher makes the frame taller. */
  height: number
}

export const DEFAULT_PROFILE_MEDIA_FRAME: ProfileMediaFrame = {
  focusX: 50,
  focusY: 0,
  zoom: 1,
  height: 1,
}

export const PROFILE_FRAME_ZOOM_MIN = 1
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

export function profileMediaFitStyle(frame: ProfileMediaFrame): {
  objectFit: 'cover'
  objectPosition: string
  transform: string
  transformOrigin: string
} {
  const objectPosition = profileMediaObjectPosition(frame)
  return {
    objectFit: 'cover',
    objectPosition,
    transform: frame.zoom === 1 ? 'none' : `scale(${frame.zoom})`,
    transformOrigin: objectPosition,
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
