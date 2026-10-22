import { getDefaultThemeConfig, type CardThemeConfig, type ThemeMode } from '@/lib/theme/cardThemeContract'
import { ensureReadableColorSet } from '@/lib/theme/colorAccessibility'

/** Sources that may overwrite Card Settings → Global Color. Pure AI "suggestion" never does. */
export const BRAND_THEME_APPLY_SOURCES = ['document', 'website', 'logo', 'mixed'] as const
export type BrandThemeApplySource = (typeof BRAND_THEME_APPLY_SOURCES)[number]

export type ThemeRecommendationTriplet = {
  primary?: string
  secondary?: string
  accent?: string
}

export type ThemeRecommendation = {
  light?: ThemeRecommendationTriplet | null
  dark?: ThemeRecommendationTriplet | null
  source?: string | null
  notes?: string | null
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function normalizeBrandHex(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!HEX_RE.test(trimmed)) return null
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase()
  }
  return trimmed.toLowerCase()
}

export function isBrandThemeApplySource(source: string | null | undefined): source is BrandThemeApplySource {
  return Boolean(source && (BRAND_THEME_APPLY_SOURCES as readonly string[]).includes(source))
}

function recommendationHasHex(recommendation: ThemeRecommendation | null | undefined): boolean {
  if (!recommendation || typeof recommendation !== 'object') return false
  return Boolean(
    normalizeBrandHex(recommendation.light?.primary) ||
    normalizeBrandHex(recommendation.light?.secondary) ||
    normalizeBrandHex(recommendation.light?.accent) ||
    normalizeBrandHex(recommendation.dark?.primary) ||
    normalizeBrandHex(recommendation.dark?.secondary) ||
    normalizeBrandHex(recommendation.dark?.accent)
  )
}

/** Only apply Global Color for document / website / logo / mixed evidence. */
export function shouldApplyBrandThemeConfig(recommendation: ThemeRecommendation | null | undefined): boolean {
  return isBrandThemeApplySource(recommendation?.source) && recommendationHasHex(recommendation)
}

function brandSourceLabel(source: string | null | undefined): string {
  if (source === 'document') return 'PDF / document'
  if (source === 'website') return 'website'
  if (source === 'logo') return 'logo'
  if (source === 'mixed') return 'website + document'
  return 'brand sources'
}

export function describeBrandThemeSource(recommendation: ThemeRecommendation | null | undefined): string {
  if (!shouldApplyBrandThemeConfig(recommendation)) {
    return 'Using the default Global Color. Change Primary / Secondary / Accent below before save.'
  }
  return `Picked from your ${brandSourceLabel(recommendation?.source)} — edit before save if you want.`
}

function applyTriplet(
  base: CardThemeConfig['colors']['light'],
  recommended: ThemeRecommendationTriplet | null | undefined
): CardThemeConfig['colors']['light'] {
  const next = {
    ...base,
    primary: normalizeBrandHex(recommended?.primary) || base.primary,
    secondary: normalizeBrandHex(recommended?.secondary) || base.secondary,
    accent: normalizeBrandHex(recommended?.accent) || base.accent,
  }
  const readable = ensureReadableColorSet(next)
  return {
    ...next,
    text: readable.text,
    textMuted: readable.textMuted,
    border: readable.border,
  }
}

/**
 * Merge light/dark Primary·Secondary·Accent from AI/crawl evidence into themeConfig
 * (Card Settings → Theme → Global Color). Preserves wallpaper/components/appearance.
 */
export function applyThemeRecommendationToConfig(
  current: CardThemeConfig | null | undefined,
  recommendation: ThemeRecommendation | null | undefined
): CardThemeConfig | null {
  if (!shouldApplyBrandThemeConfig(recommendation) || !recommendation) return null
  const base = current || getDefaultThemeConfig('v3')
  return {
    ...base,
    colors: {
      ...base.colors,
      light: applyTriplet(base.colors.light, recommendation.light),
      dark: applyTriplet(base.colors.dark, recommendation.dark),
    },
  }
}

export function flatThemeFromConfig(
  config: CardThemeConfig,
  mode?: ThemeMode
): { primaryColor: string; secondaryColor: string; accentColor: string } {
  const set = config.colors[mode || (config.colors.defaultMode === 'light' ? 'light' : 'dark')]
  return {
    primaryColor: set.primary,
    secondaryColor: set.secondary,
    accentColor: set.accent,
  }
}

export function readThemeRecommendationFromJob(job: {
  businessProfile?: { themeRecommendation?: ThemeRecommendation | null } | null
  themeRecommendation?: ThemeRecommendation | null
}): ThemeRecommendation | null {
  return job.businessProfile?.themeRecommendation || job.themeRecommendation || null
}
