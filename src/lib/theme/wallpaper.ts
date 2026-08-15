import { isVideoUrl } from '@/lib/mediaUrl'
import {
  getDefaultThemeConfig,
  type CardThemeConfig,
  type CardWallpaperConfig,
  type ProfileTemplateId,
} from '@/lib/theme/cardThemeContract'

export type { CardWallpaperConfig }

export type WallpaperStyleId = 'fill' | 'gradient' | 'blur' | 'pattern' | 'image' | 'video'

export type WallpaperPatternId = 'dots' | 'grid' | 'diagonal'

export type WallpaperGradientMode = 'custom' | 'premade'

export const WALLPAPER_STYLE_IDS: WallpaperStyleId[] = ['fill', 'gradient', 'blur', 'pattern', 'image', 'video']

export const WALLPAPER_PATTERN_IDS: WallpaperPatternId[] = ['dots', 'grid', 'diagonal']

export const PREMADE_GRADIENTS: { id: string; from: string; to: string; css: string }[] = [
  { id: 'pink', from: '#DBA6CA', to: '#E5BDD9', css: 'linear-gradient(to top right, #DBA6CA, #E5BDD9)' },
  { id: 'orange', from: '#DF8C4C', to: '#EFC6A6', css: 'linear-gradient(to top right, #DF8C4C, #EFC6A6)' },
  { id: 'lime', from: '#CBEA8B', to: '#E3F2BE', css: 'linear-gradient(to top right, #CBEA8B, #E3F2BE)' },
  { id: 'green', from: '#A9E88E', to: '#D5F0C6', css: 'linear-gradient(to top right, #A9E88E, #D5F0C6)' },
  { id: 'indigo', from: '#342F79', to: '#804253', css: 'linear-gradient(to top right, #342F79, #804253)' },
  { id: 'violet', from: '#120F3B', to: '#51365F', css: 'linear-gradient(to top right, #120F3B, #51365F)' },
  { id: 'mauve', from: '#3F4882', to: '#B3709B', css: 'linear-gradient(to top right, #3F4882, #B3709B)' },
  {
    id: 'sunset',
    from: '#B04C40',
    to: '#A3C6D3',
    css: 'linear-gradient(to top, #B04C40, #D1A0A6, #A3C6D3)',
  },
  { id: 'rust', from: '#B2462E', to: '#B2462E', css: 'linear-gradient(to top right, #B2462E, #B2462E)' },
]

export const DEFAULT_WALLPAPER: CardWallpaperConfig = {
  style: 'image',
  fillColor: '#0a0a0a',
  gradientMode: 'custom',
  gradientFrom: '#B04C40',
  gradientTo: '#A3C6D3',
  premadeId: 'sunset',
  patternId: 'dots',
}

function isWallpaperStyleId(value: unknown): value is WallpaperStyleId {
  return typeof value === 'string' && (WALLPAPER_STYLE_IDS as string[]).includes(value)
}

function isPatternId(value: unknown): value is WallpaperPatternId {
  return typeof value === 'string' && (WALLPAPER_PATTERN_IDS as string[]).includes(value)
}

/** Normalize raw wallpaper from API / editor into a safe config (may omit style if unset). */
export function normalizeWallpaper(raw: unknown): CardWallpaperConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (!isWallpaperStyleId(r.style)) return undefined

  const next: CardWallpaperConfig = { style: r.style }

  if (typeof r.fillColor === 'string' && r.fillColor.trim()) next.fillColor = r.fillColor.trim()
  if (r.gradientMode === 'custom' || r.gradientMode === 'premade') next.gradientMode = r.gradientMode
  if (typeof r.gradientFrom === 'string' && r.gradientFrom.trim()) next.gradientFrom = r.gradientFrom.trim()
  if (typeof r.gradientTo === 'string' && r.gradientTo.trim()) next.gradientTo = r.gradientTo.trim()
  if (typeof r.premadeId === 'string' && r.premadeId.trim()) next.premadeId = r.premadeId.trim()
  if (isPatternId(r.patternId)) next.patternId = r.patternId

  return next
}

/**
 * Style shown in the editor / public card.
 * When wallpaper is unset, infer from media URL so existing cards keep image/video covers.
 * Pass `fallbackMediaUrl` (e.g. DEFAULT_COVER) so empty uploads still match the public fallback media type.
 */
export function resolveWallpaperStyle(
  themeConfig: CardThemeConfig | null | undefined,
  bgMediaUrl?: string | null,
  fallbackMediaUrl?: string | null
): WallpaperStyleId {
  const stored = themeConfig?.wallpaper?.style
  if (stored && isWallpaperStyleId(stored)) return stored

  const media = bgMediaUrl?.trim() || fallbackMediaUrl?.trim() || ''
  if (media && isVideoUrl(media)) return 'video'
  return 'image'
}

/** Infer image vs video from a media URL alone (for upload sync). */
export function inferMediaWallpaperStyle(
  mediaUrl?: string | null,
  fallbackMediaUrl?: string | null
): 'image' | 'video' {
  const media = mediaUrl?.trim() || fallbackMediaUrl?.trim() || ''
  if (media && isVideoUrl(media)) return 'video'
  return 'image'
}

/** Full wallpaper config for rendering (fills defaults for unset optional fields). */
export function resolveWallpaperConfig(
  themeConfig: CardThemeConfig | null | undefined,
  bgMediaUrl?: string | null,
  fallbackMediaUrl?: string | null
): CardWallpaperConfig {
  const style = resolveWallpaperStyle(themeConfig, bgMediaUrl, fallbackMediaUrl)
  const stored = themeConfig?.wallpaper
  return {
    ...DEFAULT_WALLPAPER,
    ...stored,
    style,
  }
}

export function wallpaperNeedsMedia(style: WallpaperStyleId): boolean {
  return style === 'image' || style === 'video' || style === 'blur'
}

export function resolveGradientCss(wallpaper: CardWallpaperConfig): string {
  if (wallpaper.gradientMode === 'premade' && wallpaper.premadeId) {
    const premade = PREMADE_GRADIENTS.find((g) => g.id === wallpaper.premadeId)
    if (premade) return premade.css
  }
  const from = wallpaper.gradientFrom || DEFAULT_WALLPAPER.gradientFrom!
  const to = wallpaper.gradientTo || DEFAULT_WALLPAPER.gradientTo!
  return `linear-gradient(to top right, ${from}, ${to})`
}

export function resolvePatternBackgroundLayers(
  patternId: WallpaperPatternId | undefined,
  fillColor: string
): { backgroundColor: string; backgroundImage: string } {
  const base = fillColor || DEFAULT_WALLPAPER.fillColor!
  switch (patternId) {
    case 'grid':
      return {
        backgroundColor: base,
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(255,255,255,0.12) 11px, rgba(255,255,255,0.12) 12px), repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(255,255,255,0.12) 11px, rgba(255,255,255,0.12) 12px)',
      }
    case 'diagonal':
      return {
        backgroundColor: base,
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 16px)',
      }
    case 'dots':
    default:
      return {
        backgroundColor: base,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
      }
  }
}

/** @deprecated Prefer resolvePatternBackgroundLayers to avoid shorthand/longhand conflicts. */
export function resolvePatternBackground(patternId: WallpaperPatternId | undefined, fillColor: string): string {
  const { backgroundColor, backgroundImage } = resolvePatternBackgroundLayers(patternId, fillColor)
  return `${backgroundColor} ${backgroundImage}`
}

export function patternBackgroundSize(patternId: WallpaperPatternId | undefined): string {
  switch (patternId) {
    case 'grid':
    case 'diagonal':
      return 'auto'
    case 'dots':
    default:
      return '12px 12px'
  }
}

/** Merge a wallpaper patch onto an existing (or default) theme config for editor saves. */
export function patchThemeConfigWallpaper(
  current: CardThemeConfig | null | undefined,
  patch: Partial<CardWallpaperConfig>,
  template: ProfileTemplateId = 'v3'
): CardThemeConfig {
  const base = current ? { ...current } : getDefaultThemeConfig(template)
  const prev = base.wallpaper ?? { style: resolveWallpaperStyle(base) }
  return {
    ...base,
    wallpaper: {
      ...DEFAULT_WALLPAPER,
      ...prev,
      ...patch,
      style: patch.style ?? prev.style ?? DEFAULT_WALLPAPER.style,
    },
  }
}
