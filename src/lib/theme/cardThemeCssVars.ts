import { fontFamilyToStack } from '@/lib/fonts'
import {
  cornerStyleToRadius,
  type CardThemeConfig,
  type ColorToken,
  type ComponentAppearance,
  type ComponentModeColors,
  type ComponentStyle,
  type ThemeColorSet,
  type ThemeMode,
} from '@/lib/theme/cardThemeContract'
import { ensureContrastPair } from '@/lib/theme/resolveCardTheme'
import {
  buildSoftBannerGradient,
  resolveBannerStyle,
  resolveContentCardStyle,
  resolveFaqItemStyle,
  resolveReviewCardStyle,
  resolveTopNavBarStyle,
} from '@/lib/theme/sectionStyleDefaults'
import type { CSSProperties } from 'react'

function colorFromToken(token: ColorToken | undefined, set: ThemeColorSet, fallback: string): string {
  if (!token || token === 'auto') return fallback
  if (token === 'primary') return set.primary
  if (token === 'secondary') return set.secondary
  if (token === 'accent') return set.accent
  return token
}

function resolveComponentColors(
  appearance: ComponentAppearance,
  set: ThemeColorSet,
  mode: ThemeMode
): { fill: string; foreground: string; borderColor: string; hoverOverlay: string; style: ComponentStyle } {
  const modeColors: ComponentModeColors = appearance.colors[mode]
  const roleFill = colorFromToken(modeColors.fill, set, set.accent)
  const style = appearance.style

  let fill = roleFill
  let foreground: string

  if (style === 'soft') {
    fill = `color-mix(in srgb, ${roleFill} 18%, transparent)`
    foreground =
      modeColors.foreground && modeColors.foreground !== 'auto'
        ? colorFromToken(modeColors.foreground, set, roleFill)
        : roleFill
  } else if (style === 'glass') {
    // Frosted surface — always white label/icon for both CTAs and icon buttons.
    fill = `color-mix(in srgb, ${roleFill} 28%, transparent)`
    foreground = '#ffffff'
  } else if (style === 'outlined') {
    // Transparent / light tint surface — always white label/icon (Template Settings).
    if (mode === 'light') {
      fill = `color-mix(in srgb, ${roleFill} 10%, transparent)`
    } else {
      fill = `color-mix(in srgb, ${set.secondary} 55%, transparent)`
    }
    foreground = '#ffffff'
  } else if (style === 'ghost') {
    fill = 'transparent'
    foreground =
      modeColors.foreground && modeColors.foreground !== 'auto'
        ? colorFromToken(modeColors.foreground, set, roleFill)
        : roleFill
  } else {
    // filled / solid — prefer secondary (dark blue) on brand gold/primary fills
    if (modeColors.foreground && modeColors.foreground !== 'auto') {
      foreground = colorFromToken(modeColors.foreground, set, set.secondary)
    } else if (modeColors.fill === 'primary' || modeColors.fill === 'accent') {
      foreground = set.secondary
    } else {
      foreground = ensureContrastPair(roleFill).foreground
    }
  }

  const borderColor = colorFromToken(modeColors.borderColor, set, roleFill)
  const hoverOverlay = modeColors.hoverOverlay ?? (mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)')

  return { fill, foreground, borderColor, hoverOverlay, style }
}

function componentVars(prefix: string, appearance: ComponentAppearance, set: ThemeColorSet, mode: ThemeMode) {
  const resolved = resolveComponentColors(appearance, set, mode)
  return {
    [`${prefix}-style`]: resolved.style,
    [`${prefix}-fill`]: resolved.fill,
    [`${prefix}-fg`]: resolved.foreground,
    [`${prefix}-border-color`]: resolved.borderColor,
    [`${prefix}-hover-overlay`]: resolved.hoverOverlay,
    [`${prefix}-border-width`]:
      resolved.style === 'outlined' ||
      resolved.style === 'ghost' ||
      resolved.style === 'glass' ||
      resolved.style === 'soft'
        ? '1px'
        : '0px',
    // Light frosted panel on outline buttons (readable over video / light panels)
    [`${prefix}-blur`]: resolved.style === 'glass' ? '12px' : resolved.style === 'outlined' ? '8px' : '0px',
  }
}

function buttonShadowCss(id: CardThemeConfig['appearance']['buttonShadow']): string {
  switch (id) {
    case 'soft':
      return '0 4px 14px -4px rgba(0,0,0,0.22)'
    case 'strong':
      return '0 12px 28px -8px rgba(0,0,0,0.38)'
    case 'hard':
      return '5px 5px 0 0 rgba(15,23,42,0.85)'
    default:
      return 'none'
  }
}

/**
 * Build CSS custom properties for the active light/dark mode.
 * Includes page colors + primary/secondary/accent buttons + social icons.
 */
export function cardThemeCssVars(config: CardThemeConfig, mode: ThemeMode): CSSProperties {
  const set = mode === 'light' ? config.colors.light : config.colors.dark
  const radius = cornerStyleToRadius(config.appearance.cornerStyle)
  const social = config.components.socialIcon
  /** Layout surfaces always use rounded-2xl (16px). API cornerStyle drives buttons/icons/pills only. */
  const layoutRadius = '16px'
  const fontStack = fontFamilyToStack(config.appearance.fontFamily)

  const vars: Record<string, string> = {
    '--vbiz-primary': set.primary,
    '--vbiz-secondary': set.secondary,
    '--vbiz-accent': set.accent,
    '--vbiz-bg': set.background,
    '--vbiz-surface': set.surface,
    '--vbiz-text': set.text,
    '--vbiz-text-muted': set.textMuted,
    '--vbiz-border': set.border,
    '--vbiz-overlay': set.overlay,
    '--vbiz-radius': layoutRadius,
    '--vbiz-btn-radius': `${radius}px`,
    '--vbiz-btn-shadow': buttonShadowCss(config.appearance.buttonShadow),
    '--vbiz-font': fontStack,
    '--font-sans': fontStack,
    '--font-heading': fontStack,
    '--color-gold': set.accent,
    '--color-gold-dark': `color-mix(in srgb, ${set.accent} 72%, black)`,
    '--vbiz-accent-dark': `color-mix(in srgb, ${set.accent} 72%, black)`,
    '--vbiz-accent-light': `color-mix(in srgb, ${set.accent} 12%, white)`,
    '--vbiz-accent-muted': `color-mix(in srgb, ${set.accent} 70%, transparent)`,
    '--vbiz-accent-subtle': `color-mix(in srgb, ${set.accent} 15%, transparent)`,
    '--vbiz-accent-faint': `color-mix(in srgb, ${set.accent} 10%, transparent)`,
    '--vbiz-accent-border': `color-mix(in srgb, ${set.accent} 55%, transparent)`,
    '--vbiz-accent-shadow': `color-mix(in srgb, ${set.accent} 30%, transparent)`,
    '--vbiz-accent-glow': `color-mix(in srgb, ${set.accent} 75%, transparent)`,
    /* Semantic typography & surfaces */
    '--vbiz-title': set.text,
    '--vbiz-pin': set.accent,
    '--vbiz-description': set.textMuted,
    '--vbiz-modal-bg': `color-mix(in srgb, ${set.surface} 98%, transparent)`,
    '--vbiz-modal-border': set.border,
  }

  // Three button types
  for (const role of ['primary', 'secondary', 'accent'] as const) {
    Object.assign(vars, componentVars(`--vbiz-btn-${role}`, config.components.button[role], set, mode))
  }

  // Default button tokens = accent button (most common CTA)
  Object.assign(vars, componentVars('--vbiz-btn', config.components.button.accent, set, mode))
  vars['--vbiz-btn-radius'] = `${radius}px`

  // Social icons (separate style + bg + icon color)
  Object.assign(vars, componentVars('--vbiz-social', social, set, mode))
  vars['--vbiz-social-radius'] =
    typeof social.cornerRadius === 'number' ? `${social.cornerRadius}px` : String(social.cornerRadius)
  vars['--vbiz-social-icon-size'] = `${Math.max(22, social.iconSize || 22)}px`
  vars['--vbiz-social-size'] = `${social.size}px`

  const banner = resolveBannerStyle(set, mode, config.components.sectionBanner)
  const contentCard = resolveContentCardStyle(set, mode, config.components.contentCard)
  const review = resolveReviewCardStyle(set, mode, config.components.reviewCard)
  const faq = resolveFaqItemStyle(set, mode, config.components.faqItem)
  const topNav = resolveTopNavBarStyle(set, mode, config.components.topNavBar)

  vars['--vbiz-banner-variant'] = banner.variant || 'solid'
  vars['--vbiz-banner-bg'] = banner.bg || set.secondary
  vars['--vbiz-banner-gradient-from'] = banner.gradientFrom || set.accent
  vars['--vbiz-banner-gradient-to'] = banner.gradientTo || '#020617'
  vars['--vbiz-banner-title'] = banner.title || '#ffffff'
  vars['--vbiz-banner-description'] = banner.description || 'rgba(255,255,255,0.78)'
  vars['--vbiz-banner-note'] = banner.note || vars['--vbiz-banner-description']
  vars['--vbiz-banner-label'] = banner.label || set.accent
  vars['--vbiz-banner-text'] = banner.text || vars['--vbiz-banner-title']
  vars['--vbiz-banner-border'] = banner.border || `color-mix(in srgb, ${set.accent} 35%, transparent)`
  vars['--vbiz-banner-image'] = banner.imageUrl ? `url(${JSON.stringify(banner.imageUrl)})` : 'none'
  vars['--vbiz-banner-image-fit'] = banner.imageFit || 'cover'
  vars['--vbiz-banner-image-position'] = banner.imagePosition || 'center'

  vars['--vbiz-content-card-bg'] = contentCard.bg || set.surface
  vars['--vbiz-content-card-border'] = contentCard.border || set.border
  vars['--vbiz-content-card-title'] = contentCard.title || set.text
  vars['--vbiz-content-card-text'] = contentCard.text || set.text
  vars['--vbiz-content-card-desc'] = contentCard.description || set.textMuted
  vars['--vbiz-content-card-icon'] = contentCard.icon || set.accent
  vars['--vbiz-content-card-image-radius'] = `${cornerStyleToRadius(contentCard.imageCorner || 'round')}px`
  vars['--vbiz-content-card-image-fit'] = contentCard.imageFit || 'cover'
  vars['--vbiz-content-card-image-position'] = contentCard.imagePosition || 'center'

  vars['--vbiz-review-card-bg'] = review.cardBg || set.surface
  vars['--vbiz-review-text'] = review.text || set.text
  vars['--vbiz-review-star'] = review.star || set.accent
  vars['--vbiz-review-user-name'] = review.userName || set.text
  vars['--vbiz-review-user-meta'] = review.userMeta || set.textMuted
  vars['--vbiz-review-slider-track'] = review.sliderTrack || set.border
  vars['--vbiz-review-slider-fill'] = review.sliderFill || set.accent

  vars['--vbiz-faq-question-bg'] = faq.questionBg || set.surface
  vars['--vbiz-faq-question-fg'] = faq.questionFg || set.text
  vars['--vbiz-faq-answer-bg'] = faq.answerBg || set.background
  vars['--vbiz-faq-answer-fg'] = faq.answerFg || set.textMuted
  vars['--vbiz-faq-border'] = faq.border || set.border
  vars['--vbiz-faq-icon'] = faq.icon || set.accent

  const navVariant = topNav.variant || 'solid'
  vars['--vbiz-nav-variant'] = navVariant
  vars['--vbiz-nav-bg'] = topNav.bg || (mode === 'light' ? '#ffffff' : set.surface)
  vars['--vbiz-nav-gradient-from'] = topNav.gradientFrom || set.primary
  vars['--vbiz-nav-gradient-to'] = topNav.gradientTo || set.secondary
  // Default icons = brand primary (#eed677 on v3), not secondary navy.
  vars['--vbiz-nav-item'] = topNav.item || set.primary
  vars['--vbiz-nav-item-active'] = topNav.itemActive || set.primary
  vars['--vbiz-nav-border'] = topNav.border || (mode === 'light' ? set.primary : set.accent)
  // Drive gradient vs plane without relying on data-nav-variant timing.
  vars['--vbiz-nav-bg-image'] =
    navVariant === 'solid'
      ? 'none'
      : `linear-gradient(135deg, ${vars['--vbiz-nav-gradient-from']} 0%, ${vars['--vbiz-nav-gradient-to']} 100%)`

  const bannerOverride = config.components.sectionBanner?.[mode]
  const bannerPaintCustom = Boolean(
    bannerOverride &&
    (bannerOverride.variant ||
      bannerOverride.bg ||
      bannerOverride.gradientFrom ||
      bannerOverride.gradientTo ||
      bannerOverride.imageUrl)
  )
  if (bannerOverride?.title) vars['--vbiz-banner-title-override'] = banner.title || '#ffffff'
  if (bannerOverride?.description) {
    vars['--vbiz-banner-description-override'] = banner.description || 'rgba(255,255,255,0.78)'
  }

  const bannerVariant = bannerOverride?.variant || banner.variant || 'solid'
  const bannerFrom = banner.gradientFrom || set.primary
  const bannerTo = banner.gradientTo || set.secondary
  if (bannerPaintCustom && bannerVariant === 'solid' && bannerOverride?.bg) {
    vars['--vbiz-banner-bg'] = bannerOverride.bg
  }
  vars['--vbiz-banner-bg-image'] =
    bannerVariant === 'solid'
      ? 'none'
      : bannerVariant === 'image'
        ? `linear-gradient(180deg, rgba(2,6,23,0.45), rgba(2,6,23,0.72)), ${vars['--vbiz-banner-image']}`
        : buildSoftBannerGradient(bannerFrom, bannerTo)

  // Home identity defaults (overridden by displayGeneralRootStyle when Card Settings set colors).
  vars['--vbiz-home-heading'] = mode === 'light' ? set.secondary : '#ffffff'
  vars['--vbiz-home-description'] = set.primary

  return vars as CSSProperties
}

export function cardThemeVarRecord(config: CardThemeConfig, mode: ThemeMode): Record<string, string> {
  return cardThemeCssVars(config, mode) as unknown as Record<string, string>
}

function cssDeclarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
}

export function buildCardThemeStyleSheet(config: CardThemeConfig, mode: ThemeMode): string {
  const light = cardThemeVarRecord(config, 'light')
  const dark = cardThemeVarRecord(config, 'dark')
  const active = mode === 'light' ? light : dark

  // Fallback for first paint. Light/dark blocks below win on the card itself via
  // `.vbiz-theme-light` / `.vbiz-theme-dark`, so the public toggle does not depend
  // on `<html class="dark">` (that class is the admin shell, not the card).
  const baseScopes =
    '.vbiz-profile-root, .vbiz-preloader, .vbiz-modal-backdrop, .vbiz-modal-panel, .vbiz-theme-scope, .vbiz-loading-screen'
  const lightScopes = [
    '.vbiz-profile-root.vbiz-theme-light',
    'html:not(.dark) .vbiz-preloader',
    'html:not(.dark) .vbiz-modal-backdrop',
    'html:not(.dark) .vbiz-modal-panel',
    'html:not(.dark) .vbiz-theme-scope',
    'html:not(.dark) .vbiz-loading-screen',
  ].join(',\n')
  const darkScopes = [
    '.vbiz-profile-root.vbiz-theme-dark',
    '.vbiz-profile-root.dark',
    'html.dark .vbiz-preloader',
    'html.dark .vbiz-modal-backdrop',
    'html.dark .vbiz-modal-panel',
    'html.dark .vbiz-theme-scope',
    'html.dark .vbiz-loading-screen',
  ].join(',\n')

  return [
    `${baseScopes} {\n${cssDeclarations(active)}\n}`,
    `${lightScopes} {\n${cssDeclarations(light)}\n}`,
    `${darkScopes} {\n${cssDeclarations(dark)}\n}`,
    CARD_THEME_UTILITY_CSS,
  ].join('\n\n')
}

/** Profile shell + overlays where buttons, socials, and icon buttons inherit API theme. */
const THEME_INTERACTIVE_SCOPES = [
  '.vbiz-profile-root',
  '.vbiz-preloader',
  '.vbiz-theme-scope',
  '.vbiz-loading-screen',
  '.vbiz-modal-backdrop',
  '.vbiz-modal-panel',
] as const

/** Build `scope descendant` selectors — never comma-bind scopes without a descendant. */
function themeUi(selector: string): string {
  return THEME_INTERACTIVE_SCOPES.map((scope) => `${scope} ${selector}`).join(',\n')
}

/** Site-wide placement of theme tokens (nav, sections, eyebrows, buttons, icons). */
export const CARD_THEME_UTILITY_CSS = `
.vbiz-profile-root,
.vbiz-preloader,
.vbiz-modal-backdrop,
.vbiz-modal-panel,
.vbiz-theme-scope,
.vbiz-loading-screen {
  font-family: var(--vbiz-font, var(--font-sans, inherit));
}
.vbiz-profile-root {
  background-color: var(--vbiz-bg) !important;
  color: var(--vbiz-text) !important;
  --color-gold: var(--vbiz-accent);
  --color-gold-dark: var(--vbiz-accent-dark);
}

/* Home canvas / banner — only apply when Card Settings set --vbiz-home-* on the root */
.vbiz-profile-root .vbiz-home-canvas {
  background-color: var(--vbiz-home-bg, var(--vbiz-bg)) !important;
}
.vbiz-profile-root .vbiz-home-banner {
  background-color: var(--vbiz-home-banner, var(--vbiz-home-bg, var(--vbiz-bg))) !important;
}
.vbiz-profile-root[data-pages-header="off"] .vbiz-section-banner,
.vbiz-profile-root[data-pages-header="off"] .vbiz-title {
  display: none !important;
}

/* ---------- Buttons: primary | secondary | accent (all screens + preloaders) ---------- */
${themeUi('.vbiz-btn')},
${themeUi(".vbiz-btn[data-role='accent']")} {
  border-radius: var(--vbiz-btn-radius, 16px) !important;
  background: var(--vbiz-btn-accent-fill, var(--vbiz-btn-fill)) !important;
  color: var(--vbiz-btn-accent-fg, var(--vbiz-btn-fg)) !important;
  border: var(--vbiz-btn-accent-border-width, var(--vbiz-btn-border-width, 0px)) solid var(--vbiz-btn-accent-border-color, var(--vbiz-btn-border-color, transparent)) !important;
  backdrop-filter: blur(var(--vbiz-btn-accent-blur, var(--vbiz-btn-blur, 0px)));
  box-shadow: var(--vbiz-btn-shadow, none) !important;
  font-family: var(--vbiz-font, inherit) !important;
}
${themeUi('.vbiz-btn svg')} {
  color: inherit !important;
  stroke: currentColor;
}
${themeUi(".vbiz-btn[data-role='primary']")} {
  background: var(--vbiz-btn-primary-fill) !important;
  color: var(--vbiz-btn-primary-fg) !important;
  border: var(--vbiz-btn-primary-border-width, 0px) solid var(--vbiz-btn-primary-border-color, transparent) !important;
  backdrop-filter: blur(var(--vbiz-btn-primary-blur, 0px));
}
${themeUi(".vbiz-btn[data-role='secondary']")} {
  background: var(--vbiz-btn-secondary-fill) !important;
  color: var(--vbiz-btn-secondary-fg) !important;
  border: var(--vbiz-btn-secondary-border-width, 1px) solid var(--vbiz-btn-secondary-border-color, transparent) !important;
  backdrop-filter: blur(var(--vbiz-btn-secondary-blur, 0px));
}
/* Hover overlays only on real hover devices — iOS sticky :hover steals the first tap. */
@media (hover: hover) and (pointer: fine) {
${themeUi('.vbiz-btn:hover')} {
  background-image: linear-gradient(var(--vbiz-btn-hover-overlay, transparent), var(--vbiz-btn-hover-overlay, transparent));
}
${themeUi(".vbiz-btn[data-role='primary']:hover")} {
  background-image: linear-gradient(var(--vbiz-btn-primary-hover-overlay, transparent), var(--vbiz-btn-primary-hover-overlay, transparent));
}
${themeUi(".vbiz-btn[data-role='secondary']:hover")} {
  background-image: linear-gradient(var(--vbiz-btn-secondary-hover-overlay, transparent), var(--vbiz-btn-secondary-hover-overlay, transparent));
}
${themeUi(".vbiz-btn[data-role='accent']:hover")} {
  background-image: linear-gradient(var(--vbiz-btn-accent-hover-overlay, transparent), var(--vbiz-btn-accent-hover-overlay, transparent));
}
}

/* ---------- Social icons (style + corner from API) ---------- */
${themeUi('.vbiz-social')} {
  width: var(--vbiz-social-size, 40px) !important;
  height: var(--vbiz-social-size, 40px) !important;
  min-width: var(--vbiz-social-size, 40px) !important;
  min-height: var(--vbiz-social-size, 40px) !important;
  border-radius: var(--vbiz-social-radius, 9999px) !important;
  background-color: var(--vbiz-social-fill) !important;
  color: var(--vbiz-social-fg) !important;
  border: var(--vbiz-social-border-width, 1px) solid var(--vbiz-social-border-color, transparent) !important;
  backdrop-filter: blur(var(--vbiz-social-blur, 0px));
  font-family: var(--vbiz-font, inherit);
}
/* Side rails next to Views/Website/CRM — match .vbiz-icon-btn diameter (ignore theme social size). */
${themeUi('.vbiz-social.vbiz-social-rail')} {
  width: 2.5rem !important;
  height: 2.5rem !important;
  min-width: 2.5rem !important;
  min-height: 2.5rem !important;
}
${themeUi('.vbiz-social.vbiz-social-rail-sm')} {
  width: 2rem !important;
  height: 2rem !important;
  min-width: 2rem !important;
  min-height: 2rem !important;
}
${themeUi('.vbiz-social svg')} {
  color: inherit !important;
  stroke: currentColor;
  width: var(--vbiz-social-icon-size, 22px);
  height: var(--vbiz-social-icon-size, 22px);
}
${themeUi('.vbiz-social.vbiz-social-rail svg')},
${themeUi('.vbiz-social.vbiz-social-rail-sm svg')} {
  width: 1.375rem !important;
  height: 1.375rem !important;
}
@media (hover: hover) and (pointer: fine) {
${themeUi('.vbiz-social:hover')} {
  background-image: linear-gradient(var(--vbiz-social-hover-overlay, transparent), var(--vbiz-social-hover-overlay, transparent));
}
}

/* ---------- Toolbar / icon buttons — theme colors + button style, default corners from markup ---------- */
${themeUi('.vbiz-icon-btn')} {
  border: var(--vbiz-btn-secondary-border-width, 1px) solid var(--vbiz-btn-secondary-border-color, var(--vbiz-accent-border)) !important;
  background-color: var(--vbiz-btn-secondary-fill, var(--vbiz-accent-subtle)) !important;
  color: var(--vbiz-btn-secondary-fg, var(--vbiz-accent)) !important;
  backdrop-filter: blur(var(--vbiz-btn-secondary-blur, 8px));
  font-family: var(--vbiz-font, inherit);
}
${themeUi('.vbiz-icon-btn svg')},
${themeUi('.vbiz-icon-btn .text-gold')},
${themeUi('.vbiz-icon-btn .text-yellow-primary')} { color: inherit !important; }
/* Language button: keep country flag images visible (same assets as Select Language popup) */
${themeUi('.vbiz-icon-btn img')} {
  display: block !important;
  max-width: none;
  object-fit: cover;
  color: transparent !important;
}
@media (hover: hover) and (pointer: fine) {
${themeUi('.vbiz-icon-btn:hover')} {
  background-image: linear-gradient(var(--vbiz-btn-secondary-hover-overlay, transparent), var(--vbiz-btn-secondary-hover-overlay, transparent));
  border-color: var(--vbiz-accent) !important;
}
}

/* ---------- Floating nav chrome (follows General → Top navbar / global brand) ---------- */
.vbiz-profile-root .vbiz-floating-nav-inner {
  background-color: var(--vbiz-nav-bg, var(--vbiz-surface)) !important;
  background-image: var(--vbiz-nav-bg-image, none) !important;
  border-color: var(--vbiz-nav-border, var(--vbiz-accent)) !important;
  color: var(--vbiz-nav-item, var(--vbiz-primary)) !important;
}
/* Soft page fill under mobile bottom nav so toggle light/dark matches card bg */
.vbiz-profile-root .vbiz-nav-bottom-scrim {
  background: linear-gradient(
    to top,
    var(--vbiz-bg) 0%,
    color-mix(in srgb, var(--vbiz-bg) 88%, transparent) 55%,
    transparent 100%
  ) !important;
}

/* ---------- Nav tabs (colors only — no API corner override) ---------- */
.vbiz-profile-root .vbiz-nav-tab {
  color: var(--vbiz-nav-item, var(--vbiz-text-muted)) !important;
}
@media (hover: hover) and (pointer: fine) {
.vbiz-profile-root .vbiz-nav-tab:hover {
  color: var(--vbiz-nav-item-active, var(--vbiz-text)) !important;
}
}
.vbiz-profile-root .vbiz-nav-tab[data-active='true'],
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'],
.vbiz-profile-root .vbiz-nav-tab[aria-current='page'] {
  color: var(--vbiz-nav-item-active, var(--vbiz-accent)) !important;
}
.vbiz-profile-root .vbiz-nav-tab[data-active='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root .vbiz-nav-tab[aria-current='page'] .vbiz-nav-tab-icon,
.vbiz-profile-root .vbiz-nav-tab[data-active='true'] svg,
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'] svg,
.vbiz-profile-root .vbiz-nav-tab[aria-current='page'] svg {
  color: var(--vbiz-nav-item-active, var(--vbiz-accent)) !important;
}
.vbiz-profile-root .vbiz-nav-tab-icon {
  color: inherit;
}
.vbiz-profile-root .vbiz-nav-tab-active-bg {
  background-color: color-mix(in srgb, var(--vbiz-nav-item-active, var(--vbiz-accent)) 18%, transparent) !important;
  border-color: color-mix(in srgb, var(--vbiz-nav-border, var(--vbiz-accent)) 70%, transparent) !important;
}
.vbiz-profile-root .vbiz-nav-tab-hover-bg {
  background-color: color-mix(in srgb, var(--vbiz-nav-item-active, var(--vbiz-accent)) 10%, transparent) !important;
  border-color: color-mix(in srgb, var(--vbiz-nav-border, var(--vbiz-accent)) 25%, transparent) !important;
}
.vbiz-profile-root .vbiz-nav-tab-dot {
  background-color: var(--vbiz-nav-item-active, var(--vbiz-accent)) !important;
}
.vbiz-profile-root .vbiz-nav-scroll-btn {
  border-color: color-mix(in srgb, var(--vbiz-nav-border, var(--vbiz-accent)) 35%, transparent) !important;
  background-color: color-mix(in srgb, var(--vbiz-nav-bg, var(--vbiz-surface)) 92%, transparent) !important;
  color: var(--vbiz-nav-item-active, var(--vbiz-accent)) !important;
}

/* v2 active pill: solid accent fill + contrasting icon */
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'] .vbiz-nav-tab-active-pill {
  background-color: var(--vbiz-nav-item-active, var(--vbiz-accent)) !important;
}
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true']:has(.vbiz-nav-tab-active-pill) .vbiz-nav-tab-icon {
  color: var(--vbiz-btn-accent-fg, #0b0b0d) !important;
}

/* ---------- Eyebrow / section badges: soft gold chip + gold label ---------- */
.vbiz-profile-root .vbiz-eyebrow,
.vbiz-profile-root .bg-gold\\/10.border-gold\\/30.text-gold,
.vbiz-profile-root .bg-gold\\/10.border-gold\\/30,
.vbiz-profile-root [class*='tracking-widest'].text-gold,
.vbiz-profile-root [class*='tracking-wider'].text-gold,
.vbiz-profile-root [class*='tracking-widest'].text-yellow-primary,
.vbiz-profile-root [class*='tracking-wider'].text-yellow-primary {
  color: var(--vbiz-accent) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
  background-color: var(--vbiz-accent-subtle) !important;
}
.vbiz-profile-root .vbiz-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
  border-width: 1px;
  border-style: solid;
  padding: 0.375rem 0.75rem;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.vbiz-profile-root .vbiz-eyebrow svg { color: inherit !important; }
.vbiz-profile-root .vbiz-hero-eyebrow {
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
}

/* Section header chips (zinc badges → themed surface + muted/accent text) */
.vbiz-profile-root [class*='tracking-wider'].uppercase.border-zinc-200,
.vbiz-profile-root [class*='tracking-wider'].uppercase.dark\\:border-zinc-700\\/50 {
  border-color: var(--vbiz-border) !important;
  background-color: color-mix(in srgb, var(--vbiz-surface) 90%, transparent) !important;
  color: var(--vbiz-text-muted) !important;
}

/* ---------- Live agent FAB: gold fill + dark-blue icon (not white) ---------- */
.vbiz-profile-root .vbiz-live-agent-fab {
  background-color: var(--vbiz-live-agent-fill, var(--vbiz-accent)) !important;
  color: var(--vbiz-live-agent-fg, var(--vbiz-secondary)) !important;
  border-color: #ffffff !important;
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
  box-shadow: 0 10px 30px color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
}
.vbiz-profile-root .vbiz-live-agent-fab svg { color: inherit !important; }
.vbiz-profile-root .vbiz-live-agent-dot {
  background-color: var(--vbiz-secondary) !important;
}

/* ---------- Pill / chip icons (API corner on pills, not layout cards) ---------- */
.vbiz-profile-root .vbiz-pill-icon,
.vbiz-profile-root .vbiz-modal-icon-chip {
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
  background-color: var(--vbiz-accent-subtle) !important;
  color: var(--vbiz-accent) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
}
.vbiz-profile-root .vbiz-pill-icon svg,
.vbiz-profile-root .vbiz-modal-icon-chip svg {
  color: inherit !important;
}

/* ---------- Section banners & screen cards — always rounded-2xl, never API cornerStyle ---------- */
.vbiz-profile-root .vbiz-card,
.vbiz-profile-root .vbiz-content-card,
.vbiz-profile-root .vbiz-hero-card,
.vbiz-profile-root .vbiz-screen-card {
  background-color: var(--vbiz-content-card-bg, color-mix(in srgb, var(--vbiz-surface) 94%, transparent)) !important;
  border-color: var(--vbiz-content-card-border, var(--vbiz-border)) !important;
  color: var(--vbiz-content-card-text, var(--vbiz-text)) !important;
  border-radius: 1rem !important;
}
.vbiz-profile-root .vbiz-content-card .vbiz-title,
.vbiz-profile-root .vbiz-card .vbiz-title {
  color: var(--vbiz-content-card-title, var(--vbiz-text)) !important;
}
.vbiz-profile-root .vbiz-content-card .vbiz-description,
.vbiz-profile-root .vbiz-card .vbiz-description {
  color: var(--vbiz-content-card-desc, var(--vbiz-text-muted)) !important;
}
.vbiz-profile-root .vbiz-content-card img,
.vbiz-profile-root .vbiz-card img {
  object-fit: var(--vbiz-content-card-image-fit, cover);
  object-position: var(--vbiz-content-card-image-position, center);
  border-radius: var(--vbiz-content-card-image-radius, 1rem);
}
.vbiz-profile-root .vbiz-content-card svg,
.vbiz-profile-root .vbiz-card .vbiz-card-icon {
  color: var(--vbiz-content-card-icon, var(--vbiz-accent)) !important;
}

/* Banner: Tab banner styles win; Pages Header fill is the fallback gradient start. */
.vbiz-profile-root .vbiz-section-banner,
.vbiz-profile-root .vbiz-hero-banner,
.vbiz-profile-root .vbiz-page-header-surface {
  background-color: var(--vbiz-banner-bg, var(--vbiz-page-header-fill, transparent)) !important;
  background-image: var(--vbiz-banner-bg-image, none) !important;
  background-size: cover !important;
  background-position: var(--vbiz-banner-image-position, center) !important;
  border-color: var(--vbiz-banner-border, color-mix(in srgb, var(--vbiz-accent) 35%, transparent)) !important;
  color: var(--vbiz-banner-title-override, var(--vbiz-page-header-fg, var(--vbiz-banner-text, #ffffff))) !important;
}
.vbiz-profile-root .vbiz-page-header-surface {
  border-color: var(--vbiz-border) !important;
  border-radius: 1rem !important;
}
.vbiz-profile-root .vbiz-hero-card {
  background-color: color-mix(in srgb, var(--vbiz-surface) 96%, white) !important;
}
.vbiz-profile-root .vbiz-content-bg {
  background-color: var(--vbiz-bg) !important;
  color: var(--vbiz-text) !important;
}

/* ---------- Text / surfaces / borders (all screens) ---------- */
.vbiz-profile-root h1,
.vbiz-profile-root h3 {
  color: var(--vbiz-text) !important;
}
.vbiz-profile-root h2 {
  color: var(--vbiz-page-header-fg, var(--vbiz-text)) !important;
}
/* Home identity defaults: light heading=secondary / dark=white; description=primary both modes */
.vbiz-profile-root.vbiz-theme-light .vbiz-home-heading,
.vbiz-profile-root.vbiz-theme-light h1.vbiz-home-heading {
  color: var(--vbiz-home-heading, var(--vbiz-secondary)) !important;
}
.vbiz-profile-root.dark .vbiz-home-heading,
.vbiz-profile-root.vbiz-theme-dark .vbiz-home-heading,
.vbiz-profile-root.dark h1.vbiz-home-heading,
.vbiz-profile-root.vbiz-theme-dark h1.vbiz-home-heading {
  color: var(--vbiz-home-heading, #ffffff) !important;
}
.vbiz-profile-root .vbiz-home-description,
.vbiz-profile-root p.vbiz-home-description,
.vbiz-profile-root .vbiz-home-description span {
  color: var(--vbiz-home-description, var(--vbiz-primary)) !important;
}

/* Dark hero banners (About, etc.) — white titles in light + dark theme */
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-title,
.vbiz-profile-root .vbiz-hero-banner h2.vbiz-hero-title,
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-heading {
  color: #ffffff !important;
}
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-eyebrow {
  color: #ffffff !important;
  background-color: color-mix(in srgb, #ffffff 12%, transparent) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 45%, transparent) !important;
}
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-eyebrow svg {
  color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-subtitle,
.vbiz-profile-root .vbiz-hero-banner .text-zinc-300,
.vbiz-profile-root .vbiz-hero-banner .text-zinc-400 {
  color: color-mix(in srgb, #ffffff 78%, transparent) !important;
}
.vbiz-profile-root .vbiz-hero-banner .text-white,
.vbiz-profile-root .vbiz-hero-banner [class*='text-white'] {
  color: #ffffff !important;
}
/* Service detail title sits on the photo scrim — stay white in light theme too. */
.vbiz-profile-root .vbiz-media-hero .vbiz-media-title,
.vbiz-profile-root .vbiz-media-hero h1 {
  color: #ffffff !important;
}
/* Pillar cards on hero keep dark text on white panels */
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-card h4,
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-card .text-zinc-900 {
  color: var(--vbiz-text) !important;
}
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-card .text-zinc-500 {
  color: var(--vbiz-text-muted) !important;
}

/*
 * Pages Header banners always sit on a dark gradient (branding / Pages Header fill),
 * including in light theme. Force light content colors so titles + descriptions stay
 * readable and consistent across every section header.
 */
.vbiz-profile-root .vbiz-section-banner .vbiz-title,
.vbiz-profile-root .vbiz-section-banner h2,
.vbiz-profile-root .vbiz-section-banner h3,
.vbiz-profile-root .vbiz-page-header-surface .vbiz-title,
.vbiz-profile-root .vbiz-page-header-surface h2,
.vbiz-profile-root .vbiz-public-cards-banner h2 {
  color: var(--vbiz-banner-title-override, var(--vbiz-page-header-fg, var(--vbiz-banner-title, #ffffff))) !important;
}
.vbiz-profile-root [data-section-id='faq'] .vbiz-section-banner h2,
.vbiz-profile-root [data-section-id='faq'] .vbiz-section-banner h3,
.vbiz-profile-root [data-section-id='faq'] .vcard-faq-banner-title {
  color: var(--vbiz-banner-label, var(--vbiz-accent, #eab308)) !important;
}
.vbiz-profile-root .vbiz-section-banner .vbiz-description,
.vbiz-profile-root .vbiz-page-header-surface .vbiz-description {
  color: var(--vbiz-banner-description-override, var(--vbiz-banner-description, rgba(255,255,255,0.78))) !important;
}
.vbiz-profile-root .vbiz-review-card {
  background-color: var(--vbiz-review-card-bg, var(--vbiz-surface)) !important;
  color: var(--vbiz-review-text, var(--vbiz-text)) !important;
  border-color: var(--vbiz-content-card-border, var(--vbiz-border)) !important;
}
.vbiz-profile-root .vbiz-review-card .vbiz-review-star,
.vbiz-profile-root .vbiz-review-star {
  color: var(--vbiz-review-star, var(--vbiz-accent)) !important;
  fill: var(--vbiz-review-star, var(--vbiz-accent)) !important;
}
.vbiz-profile-root .vbiz-review-user-name { color: var(--vbiz-review-user-name, var(--vbiz-text)) !important; }
.vbiz-profile-root .vbiz-review-user-meta { color: var(--vbiz-review-user-meta, var(--vbiz-text-muted)) !important; }
.vbiz-profile-root .vbiz-faq-item,
.vbiz-profile-root [data-section-id='faq'] .vbiz-card {
  background-color: var(--vbiz-faq-question-bg, var(--vbiz-surface)) !important;
  border-color: var(--vbiz-faq-border, var(--vbiz-border)) !important;
  color: var(--vbiz-faq-question-fg, var(--vbiz-text)) !important;
}
.vbiz-profile-root [data-section-id='faq'] .vcard-faq-answer,
.vbiz-profile-root .vbiz-faq-answer {
  background-color: var(--vbiz-faq-answer-bg, var(--vbiz-bg)) !important;
  color: var(--vbiz-faq-answer-fg, var(--vbiz-text-muted)) !important;
}
.vbiz-profile-root .vbiz-section-banner .vbiz-description,
.vbiz-profile-root .vbiz-page-header-surface .vbiz-description,
.vbiz-profile-root .vbiz-public-cards-banner .vbiz-description,
.vbiz-profile-root .vbiz-section-banner p,
.vbiz-profile-root .vbiz-page-header-surface p,
.vbiz-profile-root .vbiz-public-cards-banner p,
.vbiz-profile-root .vbiz-section-banner .text-zinc-600,
.vbiz-profile-root .vbiz-section-banner .text-zinc-500,
.vbiz-profile-root .vbiz-section-banner .text-zinc-400,
.vbiz-profile-root .vbiz-section-banner .text-zinc-300,
.vbiz-profile-root .vbiz-section-banner .dark\\:text-zinc-400,
.vbiz-profile-root .vbiz-section-banner .dark\\:text-zinc-300,
.vbiz-profile-root .vbiz-page-header-surface .text-zinc-600,
.vbiz-profile-root .vbiz-page-header-surface .text-zinc-500,
.vbiz-profile-root .vbiz-page-header-surface .text-zinc-400,
.vbiz-profile-root .vbiz-page-header-surface .dark\\:text-zinc-400,
.vbiz-profile-root .vbiz-public-cards-banner .text-zinc-600,
.vbiz-profile-root .vbiz-public-cards-banner .text-zinc-300,
.vbiz-profile-root .vbiz-public-cards-banner .dark\\:text-zinc-300 {
  color: var(--vbiz-banner-description-override, var(--vbiz-banner-description, rgba(255,255,255,0.78))) !important;
}
.vbiz-profile-root .vbiz-section-banner .text-zinc-900,
.vbiz-profile-root .vbiz-section-banner .dark\\:text-zinc-100,
.vbiz-profile-root .vbiz-page-header-surface .text-zinc-900,
.vbiz-profile-root .vbiz-page-header-surface .dark\\:text-zinc-100,
.vbiz-profile-root .vbiz-public-cards-banner .text-zinc-900,
.vbiz-profile-root .vbiz-public-cards-banner .dark\\:text-white {
  color: var(--vbiz-banner-title-override, var(--vbiz-page-header-fg, var(--vbiz-banner-title, #ffffff))) !important;
}
.vbiz-profile-root .vbiz-section-banner .vbiz-eyebrow,
.vbiz-profile-root .vbiz-page-header-surface .vbiz-eyebrow {
  color: #ffffff !important;
  background-color: color-mix(in srgb, #ffffff 12%, transparent) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 45%, transparent) !important;
}
.vbiz-profile-root .vbiz-section-banner .vbiz-eyebrow svg,
.vbiz-profile-root .vbiz-page-header-surface .vbiz-eyebrow svg {
  color: var(--vbiz-accent) !important;
}
/* Zinc badge chips inside pages headers → translucent chip on dark gradient */
.vbiz-profile-root .vbiz-section-banner [class*='tracking-wider'].uppercase,
.vbiz-profile-root .vbiz-page-header-surface [class*='tracking-wider'].uppercase,
.vbiz-profile-root .vbiz-public-cards-banner [class*='tracking-wider'].uppercase,
.vbiz-profile-root .vbiz-public-cards-banner [class*='tracking-widest'].uppercase {
  color: #ffffff !important;
  background-color: color-mix(in srgb, #ffffff 12%, transparent) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 45%, transparent) !important;
}
/* Soften light-mode wash overlays so the dark gradient stays visible */
.vbiz-profile-root .vbiz-section-banner .from-zinc-100\\/50,
.vbiz-profile-root .vbiz-page-header-surface .from-zinc-100\\/40 {
  --tw-gradient-from: color-mix(in srgb, #ffffff 10%, transparent) !important;
  --tw-gradient-to: transparent !important;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
}

/* Body titles only — skip light-surface chips/pills (filters, card labels) */
.vbiz-profile-root .text-zinc-900:not(.vbiz-btn):not(.vbiz-live-agent-fab):not(.vbiz-social):not(.vbiz-filter-chip-active):not(.vbiz-card-pill):not(.vbiz-on-light-surface),
.vbiz-profile-root .dark\\:text-zinc-100 {
  color: var(--vbiz-text) !important;
}
.vbiz-profile-root .text-zinc-600,
.vbiz-profile-root .text-zinc-500,
.vbiz-profile-root .dark\\:text-zinc-400,
.vbiz-profile-root .dark\\:text-zinc-300,
.vbiz-profile-root .dark\\:text-zinc-500 {
  color: var(--vbiz-text-muted) !important;
}
.vbiz-profile-root .border-zinc-200:not(.vbiz-floating-nav-inner),
.vbiz-profile-root .border-zinc-200\\/80:not(.vbiz-floating-nav-inner),
.vbiz-profile-root .dark\\:border-zinc-800:not(.vbiz-floating-nav-inner),
.vbiz-profile-root .dark\\:border-zinc-800\\/80:not(.vbiz-floating-nav-inner),
.vbiz-profile-root .dark\\:border-zinc-700:not(.vbiz-floating-nav-inner),
.vbiz-profile-root .dark\\:border-zinc-700\\/50:not(.vbiz-floating-nav-inner) {
  border-color: var(--vbiz-border) !important;
}
.vbiz-profile-root .bg-white\\/50:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .bg-white\\/40:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .bg-white\\/80:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .bg-white\\/95:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .bg-zinc-100:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .bg-zinc-50:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .dark\\:bg-zinc-900\\/50:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .dark\\:bg-zinc-900\\/30:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .dark\\:bg-zinc-900\\/80:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .dark\\:bg-zinc-800\\/80:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .dark\\:bg-\\[\\#031327\\]\\/80:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .dark\\:bg-\\[\\#031327\\]\\/40:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner),
.vbiz-profile-root .dark\\:bg-\\[\\#031327\\]\\/60:not(.vbiz-floating-nav-inner):not(.vbiz-content-card):not(.vbiz-card):not(.vbiz-section-banner) {
  background-color: var(--vbiz-content-card-bg, var(--vbiz-surface)) !important;
  border-color: var(--vbiz-content-card-border, var(--vbiz-border)) !important;
}
/* Page / deep backgrounds → secondary-tinted (ocean concept) */
.vbiz-profile-root .bg-\\[\\#031327\\],
.vbiz-profile-root .bg-\\[\\#030914\\],
.vbiz-profile-root .bg-\\[\\#020914\\],
.vbiz-profile-root .bg-\\[\\#050505\\],
.vbiz-profile-root .bg-\\[\\#09090b\\] {
  background-color: var(--vbiz-bg) !important;
}

/* ---------- Accent / primary / secondary brand utilities ---------- */
.vbiz-profile-root .text-yellow-primary,
.vbiz-profile-root .text-gold,
.vbiz-profile-root .text-yellow-400,
.vbiz-profile-root .text-yellow-500,
.vbiz-profile-root .text-amber-700,
.vbiz-profile-root .text-amber-800,
.vbiz-profile-root .text-amber-900,
.vbiz-profile-root .text-amber-950,
.vbiz-profile-root .text-\\[\\#eab308\\],
.vbiz-profile-root .text-\\[\\#dcc969\\],
.vbiz-profile-root .text-\\[\\#eed677\\],
.vbiz-profile-root .text-\\[\\#ca8a04\\],
.vbiz-profile-root .dark\\:text-gold,
.vbiz-profile-root .dark\\:hover\\:text-gold:hover,
.vbiz-profile-root .hover\\:text-gold:hover,
.vbiz-profile-root .group-hover\\:text-gold:hover,
.vbiz-profile-root .group-hover\\/link\\:text-gold:hover,
.vbiz-profile-root .group-hover\\:text-yellow-primary:hover,
.vbiz-profile-root .hover\\:text-yellow-primary:hover {
  color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .text-gold\\/70,
.vbiz-profile-root .text-yellow-primary\\/40 {
  color: var(--vbiz-accent) !important;
  opacity: 0.7;
}
.vbiz-profile-root .bg-yellow-primary,
.vbiz-profile-root .bg-gold,
.vbiz-profile-root .bg-yellow-400,
.vbiz-profile-root .bg-yellow-500,
.vbiz-profile-root .bg-\\[\\#eab308\\],
.vbiz-profile-root .bg-\\[\\#dcc969\\],
.vbiz-profile-root .bg-\\[\\#eed677\\],
.vbiz-profile-root .hover\\:bg-gold:hover,
.vbiz-profile-root .hover\\:bg-yellow-400:hover {
  background-color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .bg-gold\\/5,
.vbiz-profile-root .bg-gold\\/10,
.vbiz-profile-root .bg-gold\\/15,
.vbiz-profile-root .bg-gold\\/20,
.vbiz-profile-root .bg-yellow-primary\\/5,
.vbiz-profile-root .bg-yellow-primary\\/10,
.vbiz-profile-root .bg-yellow-primary\\/20,
.vbiz-profile-root .hover\\:bg-gold\\/5:hover,
.vbiz-profile-root .hover\\:bg-gold\\/10:hover,
.vbiz-profile-root .hover\\:bg-gold\\/20:hover,
.vbiz-profile-root .hover\\:bg-yellow-primary\\/10:hover,
.vbiz-profile-root .dark\\:bg-yellow-primary\\/5 {
  background-color: var(--vbiz-accent-subtle) !important;
}
.vbiz-profile-root .border-yellow-primary,
.vbiz-profile-root .border-gold,
.vbiz-profile-root .border-yellow-500,
.vbiz-profile-root .border-\\[\\#eab308\\],
.vbiz-profile-root .hover\\:border-gold:hover,
.vbiz-profile-root .hover\\:border-yellow-primary:hover,
.vbiz-profile-root .group-hover\\:border-yellow-primary:hover,
.vbiz-profile-root .focus-visible\\:ring-gold\\/60:focus-visible {
  border-color: var(--vbiz-accent-border) !important;
}
.vbiz-profile-root .border-gold\\/20,
.vbiz-profile-root .border-gold\\/30,
.vbiz-profile-root .border-gold\\/35,
.vbiz-profile-root .border-gold\\/40,
.vbiz-profile-root .border-gold\\/45,
.vbiz-profile-root .border-gold\\/50,
.vbiz-profile-root .border-gold\\/55,
.vbiz-profile-root .border-gold\\/80,
.vbiz-profile-root .border-yellow-primary\\/30,
.vbiz-profile-root .border-yellow-primary\\/40,
.vbiz-profile-root .border-yellow-primary\\/50,
.vbiz-profile-root .dark\\:border-yellow-primary\\/40,
.vbiz-profile-root .dark\\:border-gold\\/20 {
  border-color: color-mix(in srgb, var(--vbiz-accent) 40%, transparent) !important;
}
.vbiz-profile-root .fill-yellow-primary,
.vbiz-profile-root .fill-gold,
.vbiz-profile-root .fill-\\[\\#eab308\\],
.vbiz-profile-root .fill-\\[\\#eed677\\] {
  fill: var(--vbiz-accent) !important;
}
.vbiz-profile-root .from-gold,
.vbiz-profile-root .from-yellow-primary,
.vbiz-profile-root .from-\\[\\#eab308\\] {
  --tw-gradient-from: var(--vbiz-accent) !important;
  --tw-gradient-to: var(--vbiz-accent-dark) !important;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
}
.vbiz-profile-root .to-gold,
.vbiz-profile-root .to-yellow-400,
.vbiz-profile-root .to-\\[\\#ca8a04\\] {
  --tw-gradient-to: var(--vbiz-accent-dark) !important;
}

/* Secondary / ocean surfaces */
.vbiz-profile-root .bg-ocean-dark,
.vbiz-profile-root .bg-ocean-deep,
.vbiz-profile-root .bg-ocean-dark\\/60,
.vbiz-profile-root .bg-ocean-dark\\/65,
.vbiz-profile-root .bg-ocean-dark\\/85,
.vbiz-profile-root .hover\\:bg-ocean-light\\/50:hover,
.vbiz-profile-root .hover\\:bg-ocean-light\\/60:hover,
.vbiz-profile-root .hover\\:bg-ocean-light\\/65:hover,
.vbiz-profile-root .hover\\:bg-ocean-light\\/70:hover,
.vbiz-profile-root .hover\\:bg-ocean-light\\/80:hover {
  background-color: color-mix(in srgb, var(--vbiz-secondary) 88%, black) !important;
}
.vbiz-profile-root .bg-ocean-light\\/30 {
  background-color: color-mix(in srgb, var(--vbiz-secondary) 30%, transparent) !important;
}

.vbiz-profile-root .vbiz-primary-bg { background-color: var(--vbiz-primary) !important; }
.vbiz-profile-root .vbiz-primary-text { color: var(--vbiz-primary) !important; }
.vbiz-profile-root .vbiz-accent-bg { background-color: var(--vbiz-accent) !important; }
.vbiz-profile-root .vbiz-accent-text { color: var(--vbiz-accent) !important; }
.vbiz-profile-root .vbiz-secondary-bg { background-color: var(--vbiz-secondary) !important; }
.vbiz-profile-root .vbiz-secondary-text { color: var(--vbiz-secondary) !important; }
.vbiz-profile-root .vbiz-surface-bg { background-color: var(--vbiz-surface) !important; }
.vbiz-profile-root .vbiz-muted-text { color: var(--vbiz-text-muted) !important; }

.vbiz-profile-root .bg-black\\/40,
.vbiz-profile-root .bg-black\\/50,
.vbiz-profile-root .bg-black\\/60,
.vbiz-profile-root .bg-black\\/80 {
  background-color: var(--vbiz-overlay) !important;
}

.vbiz-profile-root .selection\\:bg-yellow-primary\\/30::selection,
.vbiz-profile-root .selection\\:bg-yellow-500\\/30::selection,
.vbiz-profile-root .selection\\:bg-gold\\/30::selection {
  background-color: color-mix(in srgb, var(--vbiz-accent) 30%, transparent) !important;
}

/* ========== Semantic typography (title / pin / description) ========== */
.vbiz-title {
  color: var(--vbiz-page-header-fg, var(--vbiz-title, var(--vbiz-text))) !important;
}
.vbiz-pin,
.vbiz-eyebrow {
  color: var(--vbiz-pin, var(--vbiz-accent)) !important;
}
.vbiz-description {
  color: var(--vbiz-description, var(--vbiz-text-muted)) !important;
}
/* TipTap/editor HTML often ships inline black/white — force theme description color */
.vbiz-profile-root .vbiz-description.vcard-rich-html,
.vbiz-profile-root .vcard-rich-html.vbiz-description {
  color: var(--vbiz-description, var(--vbiz-text-muted)) !important;
}
.vbiz-profile-root .vbiz-description.vcard-rich-html :where(*:not(a):not(code):not(pre):not(strong):not(b):not(mark):not([style*='color'])),
.vbiz-profile-root .vcard-rich-html.vbiz-description :where(*:not(a):not(code):not(pre):not(strong):not(b):not(mark):not([style*='color'])) {
  color: inherit !important;
}
.vbiz-profile-root [data-section-id='mission'] .vcard-mission-card {
  background-image: none !important;
}
.vbiz-profile-root[data-theme='light'] [data-section-id='mission'] .vcard-mission-card,
html:not(.dark) .vbiz-profile-root [data-section-id='mission'] .vcard-mission-card {
  background-color: #ffffff !important;
}
.vbiz-profile-root[data-theme='light'] [data-section-id='mission'] .vcard-mission-title,
html:not(.dark) .vbiz-profile-root [data-section-id='mission'] .vcard-mission-title {
  color: #18181b !important;
}
.vbiz-profile-root[data-theme='light'] [data-section-id='mission'] .vcard-mission-card .vbiz-description,
.vbiz-profile-root[data-theme='light'] [data-section-id='mission'] .vcard-mission-card p,
html:not(.dark) .vbiz-profile-root [data-section-id='mission'] .vcard-mission-card .vbiz-description,
html:not(.dark) .vbiz-profile-root [data-section-id='mission'] .vcard-mission-card p {
  color: #3f3f46 !important;
}
.vbiz-profile-root[data-theme='dark'] [data-section-id='mission'] .vcard-mission-title,
html.dark .vbiz-profile-root [data-section-id='mission'] .vcard-mission-title {
  color: #f4f4f5 !important;
}
.vbiz-profile-root [data-section-id='mission'] .vcard-rich-html {
  color: inherit !important;
}
.vbiz-profile-root [data-section-id='mission'] .vcard-rich-html :where(*:not(a):not(code):not(pre):not(strong):not(b):not(mark):not([style*='color'])) {
  color: inherit !important;
}
/* Extra <span style="color: black"> under p/headings must not lock light/dark text */
.vbiz-profile-root .vcard-rich-html [style*='color: rgb(0, 0, 0)'],
.vbiz-profile-root .vcard-rich-html [style*='color:rgb(0, 0, 0)'],
.vbiz-profile-root .vcard-rich-html [style*='color: rgb(0,0,0)'],
.vbiz-profile-root .vcard-rich-html [style*='color:#000'],
.vbiz-profile-root .vcard-rich-html [style*='color: #000000'],
.vbiz-profile-root .vcard-rich-html [style*='color:#000000'],
.vbiz-profile-root .vcard-rich-html [style*='color: black'],
.vbiz-profile-root .vcard-rich-html [style*='color:black'],
.vbiz-profile-root .vcard-rich-html [style*='color: rgb(15, 23, 42)'],
.vbiz-profile-root .vcard-rich-html [style*='color:#0f172a'],
.vbiz-profile-root .vcard-rich-html [style*='color: #0f172a'],
.vbiz-profile-root .vcard-rich-html [style*='color: rgb(255, 255, 255)'],
.vbiz-profile-root .vcard-rich-html [style*='color:rgb(255, 255, 255)'],
.vbiz-profile-root .vcard-rich-html [style*='color: #ffffff'],
.vbiz-profile-root .vcard-rich-html [style*='color:#ffffff'],
.vbiz-profile-root .vcard-rich-html [style*='color: white'],
.vbiz-profile-root .vcard-rich-html [style*='color:white'] {
  color: inherit !important;
}
.vbiz-profile-root .vbiz-description.vcard-rich-html a,
.vbiz-profile-root .vcard-rich-html.vbiz-description a,
.vbiz-profile-root [data-section-id='mission'] .vcard-rich-html a {
  color: var(--vbiz-accent) !important;
}
/* Reviews body: theme text (white in dark, dark in light) — override TipTap black */
.vbiz-profile-root .vbiz-review-body,
.vbiz-profile-root .vbiz-review-body.vcard-rich-html {
  color: var(--vbiz-text) !important;
}
.vbiz-profile-root .vbiz-review-body.vcard-rich-html :where(*:not(a):not(code):not(pre):not(strong):not(b):not(mark):not([style*='color'])) {
  color: inherit !important;
}
.vbiz-profile-root .vcard-rich-html h1,
.vbiz-profile-root .prose h1 {
  font-size: 1.875rem !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
  margin: 0.6em 0 0.3em !important;
}
.vbiz-profile-root .vcard-rich-html h2,
.vbiz-profile-root .prose h2 {
  font-size: 1.5rem !important;
  font-weight: 800 !important;
  line-height: 1.25 !important;
  margin: 0.55em 0 0.25em !important;
}
.vbiz-profile-root .vcard-rich-html h3,
.vbiz-profile-root .prose h3 {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  margin: 0.5em 0 0.25em !important;
}
.vbiz-profile-root .vcard-rich-html h4,
.vbiz-profile-root .prose h4 {
  font-size: 1.125rem !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
  margin: 0.45em 0 0.2em !important;
}
.vbiz-profile-root .vcard-rich-html h5,
.vbiz-profile-root .prose h5 {
  font-size: 1rem !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
  margin: 0.4em 0 0.2em !important;
}
.vbiz-profile-root .vcard-rich-html h6,
.vbiz-profile-root .prose h6 {
  font-size: 0.875rem !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
  margin: 0.35em 0 0.2em !important;
}
.vbiz-profile-root .vcard-rich-html p,
.vbiz-profile-root .prose p {
  margin: 0.35em 0;
}
.vbiz-profile-root .vcard-rich-html strong,
.vbiz-profile-root .vcard-rich-html b,
.vbiz-profile-root .prose strong,
.vbiz-profile-root .prose b {
  color: inherit !important;
  font-weight: 700 !important;
}
.vbiz-profile-root .vcard-rich-html em,
.vbiz-profile-root .vcard-rich-html i,
.vbiz-profile-root .prose em,
.vbiz-profile-root .prose i {
  font-style: italic !important;
}
.vbiz-profile-root .vcard-rich-html u,
.vbiz-profile-root .prose u {
  text-decoration: underline;
}
.vbiz-profile-root .vcard-rich-html s,
.vbiz-profile-root .vcard-rich-html strike,
.vbiz-profile-root .vcard-rich-html del,
.vbiz-profile-root .prose s,
.vbiz-profile-root .prose del {
  text-decoration: line-through;
}
.vbiz-profile-root .vcard-rich-html mark,
.vbiz-profile-root .prose mark {
  background-color: color-mix(in srgb, var(--vbiz-accent) 42%, transparent) !important;
  color: inherit !important;
}
.vbiz-profile-root .vcard-rich-html a,
.vbiz-profile-root .prose a {
  color: var(--vbiz-accent) !important;
  text-decoration: underline;
}
.vbiz-profile-root .vcard-rich-html ul,
.vbiz-profile-root .prose ul {
  list-style: disc !important;
  padding-left: 1.25rem !important;
  margin: 0.4em 0 !important;
}
.vbiz-profile-root .vcard-rich-html ol,
.vbiz-profile-root .prose ol {
  list-style: decimal !important;
  padding-left: 1.25rem !important;
  margin: 0.4em 0 !important;
}
.vbiz-profile-root .vcard-rich-html blockquote,
.vbiz-profile-root .prose blockquote {
  border-left: 3px solid var(--vbiz-accent) !important;
  padding-left: 0.75rem !important;
  margin: 0.6em 0 !important;
}
.vbiz-profile-root .vcard-rich-html code,
.vbiz-profile-root .prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
  font-size: 0.92em !important;
  border-radius: 0.25rem;
  padding: 0.1em 0.35em;
  background: color-mix(in srgb, var(--vbiz-text) 8%, transparent);
}
.vbiz-profile-root .vcard-rich-html pre,
.vbiz-profile-root .prose pre {
  margin: 0.6em 0 !important;
  padding: 0.75rem 1rem !important;
  border-radius: 0.75rem;
  overflow-x: auto;
  background: #0f172a !important;
  color: #e2e8f0 !important;
}
.vbiz-profile-root .vcard-rich-html pre code,
.vbiz-profile-root .prose pre code {
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
}
.vbiz-profile-root .vcard-rich-html img,
.vbiz-profile-root .prose img {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
}
.vbiz-profile-root .vbiz-review-body.vcard-rich-html a {
  color: var(--vbiz-accent) !important;
}
/* FAQ answers: black in light, white in dark. Bold and highlight stay accent. */
.vbiz-profile-root .vcard-faq-answer {
  color: #000000 !important;
}
html.dark .vbiz-profile-root .vcard-faq-answer {
  color: #ffffff !important;
}
.vbiz-profile-root .vcard-faq-answer :where(p, h1, h2, h3, h4, h5, h6, li, ul, ol, blockquote, div) {
  color: inherit !important;
}
.vbiz-profile-root .vcard-faq-answer strong,
.vbiz-profile-root .vcard-faq-answer b {
  color: inherit !important;
  font-weight: 700 !important;
}
.vbiz-profile-root .vcard-faq-answer mark,
.vbiz-profile-root .vcard-faq-answer a {
  color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .vcard-faq-answer mark {
  background-color: color-mix(in srgb, var(--vbiz-accent) 42%, transparent) !important;
}

/* ========== Preloader (brand splash + intro controls) ========== */
.vbiz-preloader {
  background-color: var(--vbiz-bg) !important;
  color: var(--vbiz-text) !important;
}
.vbiz-preloader-logo {
  border-radius: 1rem !important;
  background: linear-gradient(135deg, var(--vbiz-accent), var(--vbiz-accent-dark)) !important;
  color: var(--vbiz-secondary) !important;
  box-shadow: 0 20px 40px color-mix(in srgb, var(--vbiz-accent) 30%, transparent) !important;
}
.vbiz-preloader-ring {
  border-radius: 1rem !important;
  border-color: var(--vbiz-accent) !important;
}
.vbiz-preloader-progress-track {
  background-color: color-mix(in srgb, var(--vbiz-text) 12%, transparent) !important;
}
.vbiz-preloader-progress-bar {
  background-color: var(--vbiz-accent) !important;
}
.vbiz-preloader-btn {
  border-radius: var(--vbiz-btn-radius, 16px) !important;
  border: var(--vbiz-btn-secondary-border-width, 1px) solid var(--vbiz-btn-secondary-border-color, transparent) !important;
  background: var(--vbiz-btn-secondary-fill) !important;
  color: var(--vbiz-btn-secondary-fg) !important;
  backdrop-filter: blur(var(--vbiz-btn-secondary-blur, 8px));
}
.vbiz-preloader-btn:hover {
  background-image: linear-gradient(var(--vbiz-btn-secondary-hover-overlay, transparent), var(--vbiz-btn-secondary-hover-overlay, transparent));
  border-color: var(--vbiz-accent) !important;
}
.vbiz-loading-screen {
  background-color: var(--vbiz-bg) !important;
  color: var(--vbiz-text-muted) !important;
}
.vbiz-loading-screen .vbiz-loading-spinner {
  border-color: color-mix(in srgb, var(--vbiz-text) 20%, transparent) !important;
  border-top-color: var(--vbiz-accent) !important;
}

/* ---------- Layout radius utility (fixed 2xl) vs interactive (API via .vbiz-btn-rounded) ---------- */
.vbiz-rounded,
.vbiz-screen-card {
  border-radius: 1rem !important;
}
.vbiz-btn-rounded {
  border-radius: var(--vbiz-btn-radius, 16px) !important;
}

/* ========== Modals / popups ========== */
.vbiz-modal-backdrop {
  background-color: var(--vbiz-overlay) !important;
  align-items: center !important;
  justify-content: center !important;
  padding-top: max(5dvh, env(safe-area-inset-top, 0px)) !important;
  padding-bottom: max(5dvh, env(safe-area-inset-bottom, 0px)) !important;
  padding-left: max(0.75rem, env(safe-area-inset-left, 0px)) !important;
  padding-right: max(0.75rem, env(safe-area-inset-right, 0px)) !important;
  box-sizing: border-box !important;
}
.vbiz-modal-panel {
  background-color: var(--vbiz-modal-bg, var(--vbiz-surface)) !important;
  border-color: var(--vbiz-modal-border, var(--vbiz-border)) !important;
  color: var(--vbiz-text) !important;
  border-radius: 1rem !important;
  max-height: 90dvh !important;
}
.vbiz-modal-header {
  border-color: var(--vbiz-border) !important;
}
.vbiz-modal-hero {
  border-color: color-mix(in srgb, var(--vbiz-accent) 25%, transparent) !important;
  background: linear-gradient(to bottom right, var(--vbiz-accent), var(--vbiz-accent-dark)) !important;
  color: var(--vbiz-secondary) !important;
}
.vbiz-modal-hero .vbiz-description {
  color: color-mix(in srgb, var(--vbiz-secondary) 75%, transparent) !important;
}
.vbiz-modal-icon-chip {
  background-color: var(--vbiz-accent-subtle) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
  color: var(--vbiz-accent) !important;
}
.vbiz-modal-icon-chip svg { color: inherit !important; }
.vbiz-modal-close {
  border-color: var(--vbiz-border) !important;
  background-color: color-mix(in srgb, var(--vbiz-surface) 90%, transparent) !important;
  color: var(--vbiz-text-muted) !important;
}
.vbiz-modal-close:hover {
  background-color: var(--vbiz-accent-subtle) !important;
  color: var(--vbiz-text) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 40%, transparent) !important;
}
.vbiz-modal-row {
  border-color: var(--vbiz-border) !important;
  background-color: color-mix(in srgb, var(--vbiz-surface) 88%, transparent) !important;
  color: var(--vbiz-text) !important;
}
.vbiz-modal-row:hover {
  border-color: color-mix(in srgb, var(--vbiz-accent) 45%, transparent) !important;
  background-color: var(--vbiz-accent-faint) !important;
}
.vbiz-modal-row-selected {
  background: linear-gradient(to bottom right, var(--vbiz-accent), var(--vbiz-accent-dark)) !important;
  color: var(--vbiz-secondary) !important;
  border-color: transparent !important;
}
.vbiz-modal-footer {
  border-color: var(--vbiz-border) !important;
  background-color: color-mix(in srgb, var(--vbiz-surface) 85%, transparent) !important;
}
.vbiz-modal-btn-primary,
.vbiz-modal-btn-accent {
  background: var(--vbiz-btn-accent-fill, var(--vbiz-accent)) !important;
  color: var(--vbiz-btn-accent-fg, var(--vbiz-secondary)) !important;
  border: var(--vbiz-btn-accent-border-width, 0px) solid var(--vbiz-btn-accent-border-color, transparent) !important;
  font-family: var(--vbiz-font, inherit) !important;
}
.vbiz-modal-btn-primary {
  background: var(--vbiz-btn-primary-fill, var(--vbiz-primary)) !important;
  color: var(--vbiz-btn-primary-fg, var(--vbiz-secondary)) !important;
}
.vbiz-modal-btn-secondary {
  background: var(--vbiz-btn-secondary-fill) !important;
  color: var(--vbiz-btn-secondary-fg) !important;
  border: var(--vbiz-btn-secondary-border-width, 1px) solid var(--vbiz-btn-secondary-border-color, transparent) !important;
  backdrop-filter: blur(var(--vbiz-btn-secondary-blur, 8px));
}
.vbiz-modal-btn-primary:hover,
.vbiz-modal-btn-accent:hover {
  background-image: linear-gradient(var(--vbiz-btn-accent-hover-overlay, transparent), var(--vbiz-btn-accent-hover-overlay, transparent));
}
.vbiz-modal-btn-secondary:hover {
  background-image: linear-gradient(var(--vbiz-btn-secondary-hover-overlay, transparent), var(--vbiz-btn-secondary-hover-overlay, transparent));
}

/* Popups — default corners from template markup; never API cornerStyle */
.vbiz-modal-backdrop .vbiz-btn,
.vbiz-modal-panel .vbiz-btn,
.vbiz-modal-backdrop .vbiz-modal-btn-primary,
.vbiz-modal-backdrop .vbiz-modal-btn-secondary,
.vbiz-modal-backdrop .vbiz-modal-btn-accent,
.vbiz-modal-panel .vbiz-modal-btn-primary,
.vbiz-modal-panel .vbiz-modal-btn-secondary,
.vbiz-modal-panel .vbiz-modal-btn-accent {
  border-radius: unset !important;
}
.vbiz-modal-backdrop .rounded-full,
.vbiz-modal-panel .rounded-full,
.vbiz-modal-backdrop .vbiz-modal-close.rounded-full,
.vbiz-modal-panel .vbiz-modal-close.rounded-full {
  border-radius: 9999px !important;
}
.vbiz-modal-backdrop .rounded-xl,
.vbiz-modal-panel.rounded-xl,
.vbiz-modal-panel .rounded-xl,
.vbiz-modal-backdrop .vbiz-modal-row.rounded-xl,
.vbiz-modal-panel .vbiz-modal-row.rounded-xl {
  border-radius: 0.75rem !important;
}
.vbiz-modal-backdrop .rounded-lg,
.vbiz-modal-panel .rounded-lg {
  border-radius: 0.5rem !important;
}
.vbiz-modal-backdrop .rounded-2xl,
.vbiz-modal-panel.rounded-2xl,
.vbiz-modal-panel .rounded-2xl {
  border-radius: 1rem !important;
}
.vbiz-modal-backdrop .rounded-t-2xl,
.vbiz-modal-panel.rounded-t-2xl,
.vbiz-modal-panel .rounded-t-2xl {
  border-top-left-radius: 1rem !important;
  border-top-right-radius: 1rem !important;
}
.vbiz-modal-backdrop .rounded-3xl,
.vbiz-modal-panel .rounded-3xl {
  border-radius: 1.5rem !important;
}
.vbiz-modal-backdrop .rounded-4xl,
.vbiz-modal-panel .rounded-4xl {
  border-radius: 2rem !important;
}
.vbiz-modal-backdrop .rounded-t-xl,
.vbiz-modal-panel.rounded-t-xl,
.vbiz-modal-panel .rounded-t-xl {
  border-top-left-radius: 0.75rem !important;
  border-top-right-radius: 0.75rem !important;
}
.vbiz-modal-backdrop .rounded-t-3xl,
.vbiz-modal-panel .rounded-t-3xl {
  border-top-left-radius: 1.5rem !important;
  border-top-right-radius: 1.5rem !important;
}
.vbiz-modal-backdrop .rounded-t-4xl,
.vbiz-modal-panel .rounded-t-4xl {
  border-top-left-radius: 2rem !important;
  border-top-right-radius: 2rem !important;
}
@media (min-width: 640px) {
  .vbiz-modal-backdrop .sm\\:rounded-2xl,
  .vbiz-modal-panel.sm\\:rounded-2xl,
  .vbiz-modal-panel .sm\\:rounded-2xl {
    border-radius: 1rem !important;
  }
  .vbiz-modal-backdrop .sm\\:rounded-xl,
  .vbiz-modal-panel.sm\\:rounded-xl,
  .vbiz-modal-panel .sm\\:rounded-xl {
    border-radius: 0.75rem !important;
  }
  .vbiz-modal-backdrop .sm\\:rounded-3xl,
  .vbiz-modal-panel.sm\\:rounded-3xl,
  .vbiz-modal-panel .sm\\:rounded-3xl {
    border-radius: 1.5rem !important;
  }
  .vbiz-modal-backdrop .sm\\:rounded-4xl,
  .vbiz-modal-panel.sm\\:rounded-4xl,
  .vbiz-modal-panel .sm\\:rounded-4xl {
    border-radius: 2rem !important;
  }
}

.vbiz-modal-input {
  border-color: var(--vbiz-border) !important;
  background-color: color-mix(in srgb, var(--vbiz-surface) 90%, transparent) !important;
  color: var(--vbiz-text) !important;
}
.vbiz-modal-input::placeholder {
  color: var(--vbiz-text-muted) !important;
  opacity: 0.75;
}

/* ---------- Filter chips (pill shape from API; bar container fixed 2xl) ---------- */
.vbiz-filter-bar {
  border-color: var(--vbiz-border) !important;
  background-color: color-mix(in srgb, var(--vbiz-surface) 88%, transparent) !important;
  box-shadow: inset 0 1px 2px color-mix(in srgb, var(--vbiz-text) 6%, transparent) !important;
  border-radius: 1rem !important;
}
.vbiz-filter-chip {
  color: var(--vbiz-text-muted) !important;
  background-color: transparent !important;
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
}
.vbiz-filter-chip:hover {
  background-color: var(--vbiz-accent-faint) !important;
  color: var(--vbiz-text) !important;
}
.vbiz-filter-chip-active,
.vbiz-filter-chip-active span {
  background-color: var(--vbiz-accent) !important;
  color: var(--vbiz-secondary) !important;
  box-shadow: 0 1px 4px color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
}

/* ---------- Gallery overlay pills & icon actions (API corner, not layout cards) ---------- */
/* Always a light chip — --vbiz-surface/--vbiz-secondary are often both dark in dark themes. */
.vbiz-card-pill {
  background-color: color-mix(in srgb, #ffffff 94%, var(--vbiz-accent)) !important;
  color: #0f172a !important;
  border: 1px solid color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
}
.vbiz-card-pill,
.vbiz-card-pill * {
  color: #0f172a !important;
}
.vbiz-card-action {
  background-color: var(--vbiz-accent) !important;
  color: var(--vbiz-secondary) !important;
  border: 1px solid color-mix(in srgb, var(--vbiz-secondary) 15%, transparent) !important;
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
}
.vbiz-card-action svg {
  color: inherit !important;
}
.vbiz-card-overlay {
  background-color: color-mix(in srgb, var(--vbiz-accent) 78%, transparent) !important;
}

/* ---------- Links (accent, readable on any bg) ---------- */
.vbiz-link {
  color: var(--vbiz-accent) !important;
}
.vbiz-link:hover {
  color: var(--vbiz-accent-dark) !important;
}

/* ---------- Accent highlight in titles (e.g. "Background", "Journey") ---------- */
.vbiz-profile-root .vbiz-accent-text {
  color: var(--vbiz-accent) !important;
}

/* ---------- Legacy section hues → API theme tokens (Resume cyan, Experience orange, etc.) ---------- */
.vbiz-profile-root .text-cyan-500,
.vbiz-profile-root .text-cyan-600,
.vbiz-profile-root .dark\\:text-cyan-400,
.vbiz-profile-root .text-orange-500,
.vbiz-profile-root .text-orange-600,
.vbiz-profile-root .dark\\:text-orange-400,
.vbiz-profile-root .text-blue-500,
.vbiz-profile-root .text-blue-600,
.vbiz-profile-root .dark\\:text-blue-400,
.vbiz-profile-root .text-emerald-500,
.vbiz-profile-root .text-emerald-600,
.vbiz-profile-root .dark\\:text-emerald-400,
.vbiz-profile-root .text-purple-500,
.vbiz-profile-root .text-purple-600,
.vbiz-profile-root .dark\\:text-purple-400 {
  color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .border-cyan-200\\/80,
.vbiz-profile-root .dark\\:border-cyan-500\\/30,
.vbiz-profile-root .border-orange-200\\/80,
.vbiz-profile-root .dark\\:border-orange-500\\/30,
.vbiz-profile-root .border-blue-200\\/80,
.vbiz-profile-root .dark\\:border-blue-500\\/30,
.vbiz-profile-root .border-emerald-200\\/80,
.vbiz-profile-root .dark\\:border-emerald-500\\/30,
.vbiz-profile-root .border-purple-200\\/80,
.vbiz-profile-root .dark\\:border-purple-500\\/30 {
  border-color: color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
}
.vbiz-profile-root .bg-cyan-50,
.vbiz-profile-root .bg-orange-50,
.vbiz-profile-root .bg-blue-50,
.vbiz-profile-root .bg-emerald-50,
.vbiz-profile-root .bg-purple-50,
.vbiz-profile-root .dark\\:bg-cyan-500\\/10,
.vbiz-profile-root .dark\\:bg-orange-500\\/10,
.vbiz-profile-root .dark\\:bg-blue-500\\/10,
.vbiz-profile-root .dark\\:bg-emerald-500\\/10,
.vbiz-profile-root .dark\\:bg-purple-500\\/10 {
  background-color: var(--vbiz-accent-subtle) !important;
  color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .bg-cyan-500\\/10,
.vbiz-profile-root .bg-orange-500\\/10,
.vbiz-profile-root .bg-blue-500\\/10,
.vbiz-profile-root .bg-emerald-500\\/10,
.vbiz-profile-root .bg-purple-500\\/10,
.vbiz-profile-root .dark\\:bg-cyan-500\\/5,
.vbiz-profile-root .dark\\:bg-orange-500\\/5,
.vbiz-profile-root .dark\\:bg-blue-500\\/5,
.vbiz-profile-root .dark\\:bg-emerald-500\\/5,
.vbiz-profile-root .dark\\:bg-purple-500\\/5 {
  background-color: var(--vbiz-accent-faint) !important;
}

/* Top navbar — must beat later surface/border remaps. Follows the card's own light/dark class. */
.vbiz-profile-root.vbiz-theme-light .vbiz-floating-nav-inner,
.vbiz-profile-root.vbiz-theme-dark .vbiz-floating-nav-inner,
.vbiz-profile-root.dark .vbiz-floating-nav-inner {
  background-color: var(--vbiz-nav-bg, var(--vbiz-surface)) !important;
  background-image: var(--vbiz-nav-bg-image, none) !important;
  border-color: var(--vbiz-nav-border, var(--vbiz-accent)) !important;
  border-style: solid !important;
  color: var(--vbiz-nav-item, var(--vbiz-primary)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab,
.vbiz-profile-root.dark .vbiz-nav-tab,
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab .vbiz-nav-tab-icon,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab .vbiz-nav-tab-icon,
.vbiz-profile-root.dark .vbiz-nav-tab .vbiz-nav-tab-icon,
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab svg,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab svg,
.vbiz-profile-root.dark .vbiz-nav-tab svg {
  color: var(--vbiz-nav-item, var(--vbiz-text-muted)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab[data-active='true'],
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab[data-active='true'],
.vbiz-profile-root.dark .vbiz-nav-tab[data-active='true'],
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab[aria-selected='true'],
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab[aria-selected='true'],
.vbiz-profile-root.dark .vbiz-nav-tab[aria-selected='true'],
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab[data-active='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab[data-active='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root.dark .vbiz-nav-tab[data-active='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab[aria-selected='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab[aria-selected='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root.dark .vbiz-nav-tab[aria-selected='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab[data-active='true'] svg,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab[data-active='true'] svg,
.vbiz-profile-root.dark .vbiz-nav-tab[data-active='true'] svg,
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab[aria-selected='true'] svg,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab[aria-selected='true'] svg,
.vbiz-profile-root.dark .vbiz-nav-tab[aria-selected='true'] svg {
  color: var(--vbiz-nav-item-active, var(--vbiz-accent)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-nav-tab[aria-selected='true']:has(.vbiz-nav-tab-active-pill) .vbiz-nav-tab-icon,
.vbiz-profile-root.vbiz-theme-dark .vbiz-nav-tab[aria-selected='true']:has(.vbiz-nav-tab-active-pill) .vbiz-nav-tab-icon,
.vbiz-profile-root.dark .vbiz-nav-tab[aria-selected='true']:has(.vbiz-nav-tab-active-pill) .vbiz-nav-tab-icon {
  color: var(--vbiz-btn-accent-fg, #0b0b0d) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-section-banner,
.vbiz-profile-root.vbiz-theme-dark .vbiz-section-banner,
.vbiz-profile-root.dark .vbiz-section-banner,
.vbiz-profile-root.vbiz-theme-light .vbiz-hero-banner,
.vbiz-profile-root.vbiz-theme-dark .vbiz-hero-banner,
.vbiz-profile-root.dark .vbiz-hero-banner {
  background-color: var(--vbiz-banner-bg, var(--vbiz-page-header-fill, transparent)) !important;
  background-image: var(--vbiz-banner-bg-image, none) !important;
  border-style: solid !important;
  border-width: 1px !important;
  border-color: var(--vbiz-banner-border, color-mix(in srgb, var(--vbiz-accent) 35%, transparent)) !important;
  color: var(--vbiz-banner-title-override, var(--vbiz-page-header-fg, var(--vbiz-banner-title, #ffffff))) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-page-header-surface,
.vbiz-profile-root.vbiz-theme-dark .vbiz-page-header-surface,
.vbiz-profile-root.dark .vbiz-page-header-surface {
  background-color: var(--vbiz-banner-bg, var(--vbiz-page-header-fill, transparent)) !important;
  background-image: var(--vbiz-banner-bg-image, none) !important;
  color: var(--vbiz-banner-title-override, var(--vbiz-page-header-fg, var(--vbiz-banner-title, #ffffff))) !important;
}

/* Tab cards (services and every other section): default light/dark card colors, owner overrides stay in the variables. */
.vbiz-profile-root.vbiz-theme-light .vbiz-content-card,
.vbiz-profile-root.vbiz-theme-dark .vbiz-content-card,
.vbiz-profile-root.dark .vbiz-content-card,
.vbiz-profile-root.vbiz-theme-light .vbiz-card:not(.vbiz-faq-item):not(.vbiz-review-card),
.vbiz-profile-root.vbiz-theme-dark .vbiz-card:not(.vbiz-faq-item):not(.vbiz-review-card),
.vbiz-profile-root.dark .vbiz-card:not(.vbiz-faq-item):not(.vbiz-review-card),
.vbiz-profile-root.vbiz-theme-light .rounded-3xl.border.bg-white\\/50:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.vbiz-theme-dark .rounded-3xl.border.bg-white\\/50:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.dark .rounded-3xl.border.bg-white\\/50:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.vbiz-theme-light .rounded-3xl.border.bg-white:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.vbiz-theme-dark .rounded-3xl.border.bg-white:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.dark .rounded-3xl.border.bg-white:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.vbiz-theme-light .rounded-2xl.border.bg-white:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.vbiz-theme-dark .rounded-2xl.border.bg-white:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner),
.vbiz-profile-root.dark .rounded-2xl.border.bg-white:not(.vbiz-review-card):not(.vbiz-section-banner):not(.vbiz-floating-nav-inner) {
  background-color: var(--vbiz-content-card-bg, var(--vbiz-surface)) !important;
  background-image: none !important;
  border-color: var(--vbiz-content-card-border, var(--vbiz-border)) !important;
  color: var(--vbiz-content-card-text, var(--vbiz-text)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-content-card .vbiz-title,
.vbiz-profile-root.vbiz-theme-dark .vbiz-content-card .vbiz-title,
.vbiz-profile-root.dark .vbiz-content-card .vbiz-title,
.vbiz-profile-root.vbiz-theme-light .vbiz-content-card h3,
.vbiz-profile-root.vbiz-theme-dark .vbiz-content-card h3,
.vbiz-profile-root.dark .vbiz-content-card h3,
.vbiz-profile-root.vbiz-theme-light .rounded-3xl.border.bg-white\\/50 h3,
.vbiz-profile-root.vbiz-theme-dark .rounded-3xl.border.bg-white\\/50 h3,
.vbiz-profile-root.dark .rounded-3xl.border.bg-white\\/50 h3,
.vbiz-profile-root.vbiz-theme-light .rounded-2xl.border.bg-white h3,
.vbiz-profile-root.vbiz-theme-dark .rounded-2xl.border.bg-white h3,
.vbiz-profile-root.dark .rounded-2xl.border.bg-white h3 {
  color: var(--vbiz-content-card-title, var(--vbiz-text)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-content-card .vbiz-description,
.vbiz-profile-root.vbiz-theme-dark .vbiz-content-card .vbiz-description,
.vbiz-profile-root.dark .vbiz-content-card .vbiz-description,
.vbiz-profile-root.vbiz-theme-light .rounded-3xl.border.bg-white\\/50 .vbiz-description,
.vbiz-profile-root.vbiz-theme-dark .rounded-3xl.border.bg-white\\/50 .vbiz-description,
.vbiz-profile-root.dark .rounded-3xl.border.bg-white\\/50 .vbiz-description,
.vbiz-profile-root.vbiz-theme-light .rounded-3xl.border.bg-white\\/50 p,
.vbiz-profile-root.vbiz-theme-dark .rounded-3xl.border.bg-white\\/50 p,
.vbiz-profile-root.dark .rounded-3xl.border.bg-white\\/50 p {
  color: var(--vbiz-content-card-desc, var(--vbiz-text-muted)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-content-card .vbiz-card-icon,
.vbiz-profile-root.vbiz-theme-dark .vbiz-content-card .vbiz-card-icon,
.vbiz-profile-root.dark .vbiz-content-card .vbiz-card-icon,
.vbiz-profile-root.vbiz-theme-light .vbiz-content-card .vbiz-card-icon svg,
.vbiz-profile-root.vbiz-theme-dark .vbiz-content-card .vbiz-card-icon svg,
.vbiz-profile-root.dark .vbiz-content-card .vbiz-card-icon svg {
  color: var(--vbiz-content-card-icon, var(--vbiz-accent)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-review-card,
.vbiz-profile-root.vbiz-theme-dark .vbiz-review-card,
.vbiz-profile-root.dark .vbiz-review-card {
  background-color: var(--vbiz-review-card-bg, var(--vbiz-surface)) !important;
  background-image: none !important;
  color: var(--vbiz-review-text, var(--vbiz-text)) !important;
  border-color: var(--vbiz-content-card-border, var(--vbiz-border)) !important;
}
.vbiz-profile-root.vbiz-theme-light .vbiz-faq-item,
.vbiz-profile-root.vbiz-theme-dark .vbiz-faq-item,
.vbiz-profile-root.dark .vbiz-faq-item {
  background-color: var(--vbiz-faq-question-bg, var(--vbiz-surface)) !important;
  border-color: var(--vbiz-faq-border, var(--vbiz-border)) !important;
  color: var(--vbiz-faq-question-fg, var(--vbiz-text)) !important;
}
`.trim()
