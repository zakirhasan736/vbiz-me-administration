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
import { CONTRAST_BODY_MIN, CONTRAST_LARGE_MIN, ensureReadableText } from '@/lib/theme/colorAccessibility'

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
  const base: BannerModeColors = {
    variant: 'gradient',
    bg: set.secondary,
    gradientFrom: set.accent,
    gradientTo: '#020617',
    title,
    description,
    note: description,
    label: set.accent,
    text: title,
    imageFit: 'cover',
    imagePosition: 'center',
  }
  const merged = pick(base, override)
  // Re-check title/desc against solid bg when variant is solid.
  if (merged.variant === 'solid' && merged.bg) {
    merged.title = ensureReadableText(merged.bg, merged.title, CONTRAST_LARGE_MIN)
    merged.description = ensureReadableText(merged.bg, merged.description, 3)
    merged.text = ensureReadableText(merged.bg, merged.text, CONTRAST_BODY_MIN)
    merged.note = ensureReadableText(merged.bg, merged.note, 3)
  }
  void mode
  return merged
}

export function deriveContentCardMode(
  set: ThemeColorSet,
  override?: ContentCardModeColors | null
): ContentCardModeColors {
  const bg = override?.bg || set.surface
  const base: ContentCardModeColors = {
    bg,
    border: set.border,
    title: ensureReadableText(bg, override?.title || set.text, CONTRAST_LARGE_MIN),
    text: ensureReadableText(bg, override?.text || set.text, CONTRAST_BODY_MIN),
    description: ensureReadableText(bg, override?.description || set.textMuted, 3),
    icon: set.accent,
    imageCorner: 'round',
    imageFit: 'cover',
    imagePosition: 'center',
  }
  return pick(base, override)
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
 * Top navbar defaults from global brand:
 * primary → bar bg / gradient from, secondary → item icons, accent → border + active.
 */
export function deriveTopNavBarMode(set: ThemeColorSet, override?: TopNavBarModeColors | null): TopNavBarModeColors {
  const bg = override?.bg || set.primary
  const item = override?.item || set.secondary || set.accent
  const itemActive = override?.itemActive || set.accent
  const border = override?.border || set.accent
  const base: TopNavBarModeColors = {
    variant: 'gradient',
    bg,
    gradientFrom: set.primary,
    gradientTo: set.secondary,
    item: ensureReadableText(bg, item, CONTRAST_LARGE_MIN),
    itemActive: ensureReadableText(bg, itemActive, CONTRAST_LARGE_MIN),
    border,
  }
  return pick(base, override)
}

export function resolveTopNavBarStyle(
  set: ThemeColorSet,
  mode: ThemeMode,
  config?: TopNavBarStyleConfig | null
): TopNavBarModeColors {
  void mode
  return deriveTopNavBarMode(set, config?.[mode])
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
