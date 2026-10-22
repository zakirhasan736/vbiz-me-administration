import type {
  BannerModeColors,
  BannerStyleConfig,
  ContentCardModeColors,
  ContentCardStyleConfig,
  FaqItemModeColors,
  FaqItemStyleConfig,
  ReviewCardModeColors,
  ReviewCardStyleConfig,
  ThemeColorSet,
  ThemeMode,
  TopNavBarModeColors,
  TopNavBarStyleConfig,
} from '@/lib/theme/cardThemeContract'
import { CONTRAST_BODY_MIN, CONTRAST_LARGE_MIN, ensureReadableText, isReadable } from '@/lib/theme/colorAccessibility'

type Rgb = { r: number; g: number; b: number; a: number }

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

/** Parse #rgb, #rrggbb, #rrggbbaa, rgb(), or rgba(). */
export function readCssColor(input: string): Rgb | null {
  const value = input.trim()
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a }
  }
  const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i)
  if (!rgb) return null
  return {
    r: clampByte(Number(rgb[1])),
    g: clampByte(Number(rgb[2])),
    b: clampByte(Number(rgb[3])),
    a: rgb[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(rgb[4]))),
  }
}

export function colorToHex(input: string, fallback = '#000000'): string {
  const parts = readCssColor(input)
  if (!parts) return fallback
  const hex = (n: number) => clampByte(n).toString(16).padStart(2, '0')
  return `#${hex(parts.r)}${hex(parts.g)}${hex(parts.b)}`
}

/**
 * Normalize a picker value to a CSS color.
 * Accepts #rgb, #rrggbb, #rrggbbaa, rgb()/rgba(), and hex pasted without '#'.
 * 3-digit hex stays uncommitted while typing (`allowShort` on blur) so `#fff` can grow into `#ffffff`.
 */
export function canonicalCssColor(input: string, allowShort = false): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  let candidate = trimmed
  if (/^[0-9a-f]+$/i.test(body)) {
    if (body.length === 3 || body.length === 4) {
      if (!allowShort) return null
    } else if (body.length !== 6 && body.length !== 8) {
      return null
    }
    candidate = `#${body}`
  }
  const parts = readCssColor(candidate)
  if (!parts) return null
  if (parts.a >= 0.995) return colorToHex(candidate)
  return colorWithAlpha(candidate, parts.a)
}

export function colorWithAlpha(input: string, alpha: number): string {
  const parts = readCssColor(input)
  if (!parts) return input
  const a = Math.max(0, Math.min(1, alpha))
  if (a >= 0.995) return colorToHex(input)
  return `rgba(${parts.r}, ${parts.g}, ${parts.b}, ${Number(a.toFixed(2))})`
}

/**
 * Tab banner gradient: primary is a 45% pigment (not a solid fill) and only
 * tints about 13% of the banner. Secondary covers the rest (~85%) so titles stay readable.
 * Picker opacity on each stop replaces the 45% / 85% defaults.
 */
export function buildSoftBannerGradient(from: string, to: string): string {
  const fromParts = readCssColor(from)
  const toParts = readCssColor(to)
  const fromHex = fromParts ? colorToHex(from) : from
  const toHex = toParts ? colorToHex(to) : to
  const pigment = fromParts ? Math.round(fromParts.a * 100) : 45
  const secondary = toParts ? Math.round(toParts.a * 100) : 85
  return `linear-gradient(135deg, color-mix(in srgb, color-mix(in srgb, ${fromHex} ${pigment}%, transparent) 13%, ${toHex}) 0%, color-mix(in srgb, ${toHex} ${secondary}%, transparent) 100%)`
}

function pick<T extends Record<string, unknown>>(base: T, override?: Partial<T> | null): T {
  if (!override) return { ...base }
  const next = { ...base }
  for (const key of Object.keys(override) as (keyof T)[]) {
    const value = override[key]
    if (value !== undefined && value !== null && value !== '') {
      next[key] = value as T[keyof T]
    }
  }
  return next
}

export function deriveBannerMode(
  set: ThemeColorSet,
  mode: ThemeMode,
  override?: BannerModeColors | null
): BannerModeColors {
  const title = ensureReadableText('#020617', override?.title || '#ffffff', CONTRAST_LARGE_MIN)
  const description = ensureReadableText('#020617', override?.description || 'rgba(255,255,255,0.78)', 3)
  // Title accent gradient follows Theme Colors (Primary → Accent), not a fixed gold.
  const titleGradientFrom = set.primary
  const titleGradientTo = set.accent?.trim() || set.primary
  const base: BannerModeColors = {
    variant: 'solid',
    bg: set.secondary,
    // Primary at 45% opacity, mixed lightly; secondary owns ~85% of the banner.
    gradientFrom: colorWithAlpha(set.primary, 0.45),
    gradientTo: colorWithAlpha(set.secondary, 0.85),
    border: colorWithAlpha(set.accent, 0.35),
    title,
    titleStyle: 'smart',
    titleGradientFrom,
    titleGradientTo,
    description,
    note: description,
    label: set.accent,
    text: title,
    imageFit: 'cover',
    imagePosition: 'center',
  }
  const merged = pick(base, override)
  // Readable defaults only. A color the owner picked for this field stays as chosen.
  if (merged.variant === 'solid' && merged.bg) {
    if (!override?.title?.trim()) merged.title = ensureReadableText(merged.bg, merged.title, CONTRAST_LARGE_MIN)
    if (!override?.description?.trim()) merged.description = ensureReadableText(merged.bg, merged.description, 3)
    if (!override?.text?.trim()) merged.text = ensureReadableText(merged.bg, merged.text, CONTRAST_BODY_MIN)
    if (!override?.note?.trim()) merged.note = ensureReadableText(merged.bg, merged.note, 3)
  }
  if (!override?.titleGradientFrom?.trim()) merged.titleGradientFrom = titleGradientFrom
  if (!override?.titleGradientTo?.trim()) merged.titleGradientTo = titleGradientTo
  if (!override?.titleStyle) merged.titleStyle = 'smart'
  void mode
  return merged
}

export function deriveContentCardMode(
  set: ThemeColorSet,
  override?: ContentCardModeColors | null
): ContentCardModeColors {
  const bg = override?.bg || set.surface
  // Body/title/description default to theme text (light → black, dark → white),
  // not muted gray — so Who We Are / content cards stay readable when toggling.
  const base: ContentCardModeColors = {
    bg,
    border: set.border,
    title: ensureReadableText(bg, override?.title || set.text, CONTRAST_LARGE_MIN),
    text: ensureReadableText(bg, override?.text || set.text, CONTRAST_BODY_MIN),
    description: ensureReadableText(bg, override?.description || set.text, 3),
    icon: set.accent,
    imageCorner: 'round',
    imageFit: 'cover',
    imagePosition: 'center',
  }
  const merged = pick(base, override)
  if (merged.bg) {
    if (!override?.title?.trim()) merged.title = ensureReadableText(merged.bg, merged.title, CONTRAST_LARGE_MIN)
    if (!override?.text?.trim()) merged.text = ensureReadableText(merged.bg, merged.text, CONTRAST_BODY_MIN)
    if (!override?.description?.trim()) merged.description = ensureReadableText(merged.bg, merged.description, 3)
  }
  return merged
}

export function deriveReviewCardMode(set: ThemeColorSet, override?: ReviewCardModeColors | null): ReviewCardModeColors {
  const cardBg = override?.cardBg || set.surface
  const base: ReviewCardModeColors = {
    cardBg,
    text: ensureReadableText(cardBg, override?.text || set.text, CONTRAST_BODY_MIN),
    star: set.accent,
    userName: ensureReadableText(cardBg, override?.userName || set.text, CONTRAST_LARGE_MIN),
    userMeta: ensureReadableText(cardBg, override?.userMeta || set.textMuted, 3),
    sliderTrack: set.border,
    sliderFill: set.accent,
  }
  return pick(base, override)
}

export function deriveFaqItemMode(set: ThemeColorSet, override?: FaqItemModeColors | null): FaqItemModeColors {
  const questionBg = override?.questionBg || set.surface
  const answerBg = override?.answerBg || set.background
  const base: FaqItemModeColors = {
    questionBg,
    questionFg: ensureReadableText(questionBg, override?.questionFg || set.text, CONTRAST_BODY_MIN),
    answerBg,
    answerFg: ensureReadableText(answerBg, override?.answerFg || set.textMuted, 3),
    border: set.border,
    icon: set.accent,
  }
  return pick(base, override)
}

export function resolveBannerStyle(
  set: ThemeColorSet,
  mode: ThemeMode,
  config?: BannerStyleConfig | null
): BannerModeColors {
  return deriveBannerMode(set, mode, config?.[mode])
}

export function resolveContentCardStyle(
  set: ThemeColorSet,
  mode: ThemeMode,
  config?: ContentCardStyleConfig | null
): ContentCardModeColors {
  return deriveContentCardMode(set, config?.[mode])
}

export function resolveReviewCardStyle(
  set: ThemeColorSet,
  mode: ThemeMode,
  config?: ReviewCardStyleConfig | null
): ReviewCardModeColors {
  return deriveReviewCardMode(set, config?.[mode])
}

export function resolveFaqItemStyle(
  set: ThemeColorSet,
  mode: ThemeMode,
  config?: FaqItemStyleConfig | null
): FaqItemModeColors {
  return deriveFaqItemMode(set, config?.[mode])
}

/**
 * Top navbar defaults — solid (plane) for light and dark.
 * Solid BG follows Theme Colors Secondary (same brand token as tab banners), never the
 * unused page `surface` navy that owners cannot edit in Theme Colors.
 * Icons prefer Primary when readable on that fill; gradient stops use Primary → Secondary.
 */
export function deriveTopNavBarMode(
  set: ThemeColorSet,
  mode: ThemeMode,
  override?: TopNavBarModeColors | null
): TopNavBarModeColors {
  // Legacy cards may have snapshot `#0b1626` (old dark surface default) as an override.
  // Ignore that so Theme Color changes re-flow into Plane (solid).
  const cleaned = scrubLegacyTopNavSurfaceOverride(override)

  const solidBg = mode === 'light' ? set.background?.trim() || '#ffffff' : set.secondary
  // Prefer brand roles that stay readable on the bar (gold on white often fails → Secondary).
  const icon = pickReadableBrand(solidBg, set.primary, set.secondary, set.accent)
  const activeIcon = pickReadableBrand(solidBg, set.accent, set.primary, set.secondary)
  const border = pickReadableBrand(solidBg, mode === 'light' ? set.primary : set.accent, set.secondary, set.primary)

  const base: TopNavBarModeColors = {
    variant: 'solid',
    bg: solidBg,
    gradientFrom: mode === 'light' ? set.background?.trim() || '#ffffff' : set.primary,
    gradientTo: mode === 'light' ? set.surface?.trim() || '#f4f5f7' : set.secondary,
    item: icon,
    itemActive: activeIcon,
    border,
  }
  return pick(base, cleaned)
}

/** Old dark Plane default used page surface `#0b1626` — not a Theme Colors brand role. */
const LEGACY_TOP_NAV_SURFACE_BG = new Set(['#0b1626', '#0b1626ff', '#020914'])

function scrubLegacyTopNavSurfaceOverride(
  override?: TopNavBarModeColors | null
): TopNavBarModeColors | null | undefined {
  if (!override) return override
  const bg = override.bg?.trim().toLowerCase()
  if (!bg || !LEGACY_TOP_NAV_SURFACE_BG.has(bg)) return override
  const next = { ...override }
  delete next.bg
  return next
}

function pickReadableBrand(bg: string, ...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && isReadable(value, bg, CONTRAST_LARGE_MIN)) return value
  }
  return ensureReadableText(bg, candidates.find((c) => c?.trim()) || undefined, CONTRAST_LARGE_MIN)
}

export function resolveTopNavBarStyle(
  set: ThemeColorSet,
  mode: ThemeMode,
  config?: TopNavBarStyleConfig | null
): TopNavBarModeColors {
  return deriveTopNavBarMode(set, mode, config?.[mode])
}

export function clearSectionStyleOverrides<T extends Record<string, unknown>>(config: T): T {
  const next = { ...config }
  delete next.sectionBanner
  delete next.contentCard
  delete next.reviewCard
  delete next.faqItem
  delete next.topNavBar
  return next
}

export type SectionStyleKey = 'sectionBanner' | 'contentCard' | 'reviewCard' | 'faqItem' | 'topNavBar'

/** Merge a per-mode patch into a section style override on themeConfig. */
export function patchSectionStyleMode(
  config: {
    components: {
      sectionBanner?: BannerStyleConfig
      contentCard?: ContentCardStyleConfig
      reviewCard?: ReviewCardStyleConfig
      faqItem?: FaqItemStyleConfig
      topNavBar?: TopNavBarStyleConfig
      [key: string]: unknown
    }
  },
  key: SectionStyleKey,
  mode: ThemeMode,
  patch: Record<string, unknown>
): typeof config {
  const existing = (config.components[key] as { light?: object; dark?: object } | undefined) ?? {}
  const modePrev = (existing[mode] as Record<string, unknown> | undefined) ?? {}
  return {
    ...config,
    components: {
      ...config.components,
      [key]: {
        ...existing,
        [mode]: { ...modePrev, ...patch },
      },
    },
  }
}

/** Remove one section override so tokens re-derive from global brand. */
export function clearOneSectionStyleOverride<T extends { components: Record<string, unknown> }>(
  config: T,
  key: SectionStyleKey
): T {
  const components = { ...config.components }
  delete components[key]
  return { ...config, components }
}
