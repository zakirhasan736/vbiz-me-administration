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
    fill = `color-mix(in srgb, ${roleFill} 28%, transparent)`
    foreground = ensureContrastPair(
      roleFill,
      modeColors.foreground && modeColors.foreground !== 'auto'
        ? colorFromToken(modeColors.foreground, set, '')
        : undefined
    ).foreground
  } else if (style === 'outlined') {
    // Modern outline: opacity surface so text stays readable (not gold-on-transparent).
    // Light ≈ previous white panel + dark text; dark ≈ ocean/secondary panel + light text.
    if (mode === 'light') {
      fill = `color-mix(in srgb, ${roleFill} 10%, #ffffff)`
      foreground =
        modeColors.foreground && modeColors.foreground !== 'auto'
          ? colorFromToken(modeColors.foreground, set, set.text)
          : set.text
    } else {
      fill = `color-mix(in srgb, ${set.secondary} 88%, #000000)`
      foreground =
        modeColors.foreground && modeColors.foreground !== 'auto'
          ? colorFromToken(modeColors.foreground, set, set.text)
          : set.text
    }
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
  vars['--vbiz-social-icon-size'] = `${social.iconSize}px`
  vars['--vbiz-social-size'] = `${social.size}px`

  return vars as CSSProperties
}

export function cardThemeVarRecord(config: CardThemeConfig, mode: ThemeMode): Record<string, string> {
  return cardThemeCssVars(config, mode) as unknown as Record<string, string>
}

export function buildCardThemeStyleSheet(config: CardThemeConfig, mode: ThemeMode): string {
  const vars = cardThemeVarRecord(config, mode)
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  // Vars on profile shell + overlays/portals outside the shell (preloader, modals, loading).
  const scopes =
    '.vbiz-profile-root, .vbiz-preloader, .vbiz-modal-backdrop, .vbiz-modal-panel, .vbiz-theme-scope, .vbiz-loading-screen'
  return `${scopes} {\n${declarations}\n}\n\n${CARD_THEME_UTILITY_CSS}`
}

/** Profile shell + overlays where buttons, socials, and icon buttons inherit API theme. */
const THEME_INTERACTIVE_SCOPES = [
  '.vbiz-profile-root',
  '.vbiz-preloader',
  '.vbiz-theme-scope',
  '.vbiz-loading-screen',
] as const

/** Build `scope descendant` selectors — never comma-bind scopes without a descendant. */
function themeUi(selector: string): string {
  return THEME_INTERACTIVE_SCOPES.map((scope) => `${scope} ${selector}`).join(',\n')
}

/** Site-wide placement of theme tokens (nav, sections, eyebrows, buttons, icons). */
export const CARD_THEME_UTILITY_CSS = `
.vbiz-profile-root {
  background-color: var(--vbiz-bg) !important;
  color: var(--vbiz-text) !important;
  --color-gold: var(--vbiz-accent);
  --color-gold-dark: var(--vbiz-accent-dark);
}

/* ---------- Buttons: primary | secondary | accent (all screens + preloaders) ---------- */
${themeUi('.vbiz-btn')},
${themeUi(".vbiz-btn[data-role='accent']")} {
  border-radius: var(--vbiz-btn-radius, 16px) !important;
  background: var(--vbiz-btn-accent-fill, var(--vbiz-btn-fill)) !important;
  color: var(--vbiz-btn-accent-fg, var(--vbiz-btn-fg)) !important;
  border: var(--vbiz-btn-accent-border-width, var(--vbiz-btn-border-width, 0px)) solid var(--vbiz-btn-accent-border-color, var(--vbiz-btn-border-color, transparent)) !important;
  backdrop-filter: blur(var(--vbiz-btn-accent-blur, var(--vbiz-btn-blur, 0px)));
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
}
${themeUi('.vbiz-social svg')} {
  color: inherit;
  width: var(--vbiz-social-icon-size, 18px);
  height: var(--vbiz-social-icon-size, 18px);
}
${themeUi('.vbiz-social:hover')} {
  background-image: linear-gradient(var(--vbiz-social-hover-overlay, transparent), var(--vbiz-social-hover-overlay, transparent));
}

/* ---------- Toolbar / icon buttons — theme colors + button style, default corners from markup ---------- */
${themeUi('.vbiz-icon-btn')} {
  border: var(--vbiz-btn-secondary-border-width, 1px) solid var(--vbiz-btn-secondary-border-color, var(--vbiz-accent-border)) !important;
  background-color: var(--vbiz-btn-secondary-fill, var(--vbiz-accent-subtle)) !important;
  color: var(--vbiz-btn-secondary-fg, var(--vbiz-accent)) !important;
  backdrop-filter: blur(var(--vbiz-btn-secondary-blur, 8px));
}
${themeUi('.vbiz-icon-btn svg')},
${themeUi('.vbiz-icon-btn .text-gold')},
${themeUi('.vbiz-icon-btn .text-yellow-primary')} { color: inherit !important; }
${themeUi('.vbiz-icon-btn:hover')} {
  background-image: linear-gradient(var(--vbiz-btn-secondary-hover-overlay, transparent), var(--vbiz-btn-secondary-hover-overlay, transparent));
  border-color: var(--vbiz-accent) !important;
}

/* ---------- Floating nav chrome (colors only — corners stay from template CSS) ---------- */
.vbiz-profile-root .vbiz-floating-nav-inner {
  background-color: color-mix(in srgb, var(--vbiz-surface) 92%, transparent) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 40%, transparent) !important;
  color: var(--vbiz-text) !important;
}

/* ---------- Nav tabs (colors only — no API corner override) ---------- */
.vbiz-profile-root .vbiz-nav-tab {
  color: var(--vbiz-text-muted) !important;
}
.vbiz-profile-root .vbiz-nav-tab:hover {
  color: var(--vbiz-text) !important;
}
.vbiz-profile-root .vbiz-nav-tab[data-active='true'],
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'],
.vbiz-profile-root .vbiz-nav-tab[aria-current='page'] {
  color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .vbiz-nav-tab[data-active='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'] .vbiz-nav-tab-icon,
.vbiz-profile-root .vbiz-nav-tab[aria-current='page'] .vbiz-nav-tab-icon,
.vbiz-profile-root .vbiz-nav-tab[data-active='true'] svg,
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'] svg,
.vbiz-profile-root .vbiz-nav-tab[aria-current='page'] svg {
  color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .vbiz-nav-tab-icon {
  color: inherit;
}
.vbiz-profile-root .vbiz-nav-tab-active-bg {
  background-color: var(--vbiz-accent-subtle) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 70%, transparent) !important;
}
.vbiz-profile-root .vbiz-nav-tab-hover-bg {
  background-color: var(--vbiz-accent-faint) !important;
  border-color: color-mix(in srgb, var(--vbiz-accent) 25%, transparent) !important;
}
.vbiz-profile-root .vbiz-nav-tab-dot {
  background-color: var(--vbiz-accent) !important;
}
.vbiz-profile-root .vbiz-nav-scroll-btn {
  border-color: color-mix(in srgb, var(--vbiz-accent) 35%, transparent) !important;
  background-color: color-mix(in srgb, var(--vbiz-surface) 92%, transparent) !important;
  color: var(--vbiz-accent) !important;
}

/* v2 active pill: solid accent fill + contrasting icon */
.vbiz-profile-root .vbiz-nav-tab[aria-selected='true'] .vbiz-nav-tab-active-pill {
  background-color: var(--vbiz-accent) !important;
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
  background-color: var(--vbiz-accent) !important;
  color: var(--vbiz-secondary) !important;
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
.vbiz-profile-root .vbiz-section-banner,
.vbiz-profile-root .vbiz-card,
.vbiz-profile-root .vbiz-hero-banner,
.vbiz-profile-root .vbiz-hero-card,
.vbiz-profile-root .vbiz-screen-card {
  background-color: color-mix(in srgb, var(--vbiz-surface) 94%, transparent) !important;
  border-color: var(--vbiz-border) !important;
  color: var(--vbiz-text) !important;
  border-radius: 1rem !important;
}
.vbiz-profile-root .vbiz-hero-banner {
  background-color: unset !important;
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
.vbiz-profile-root h2,
.vbiz-profile-root h3 {
  color: var(--vbiz-text) !important;
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
/* Pillar cards on hero keep dark text on white panels */
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-card h4,
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-card .text-zinc-900 {
  color: var(--vbiz-text) !important;
}
.vbiz-profile-root .vbiz-hero-banner .vbiz-hero-card .text-zinc-500 {
  color: var(--vbiz-text-muted) !important;
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
.vbiz-profile-root .border-zinc-200,
.vbiz-profile-root .border-zinc-200\\/80,
.vbiz-profile-root .dark\\:border-zinc-800,
.vbiz-profile-root .dark\\:border-zinc-800\\/80,
.vbiz-profile-root .dark\\:border-zinc-700,
.vbiz-profile-root .dark\\:border-zinc-700\\/50 {
  border-color: var(--vbiz-border) !important;
}
.vbiz-profile-root .bg-white\\/50,
.vbiz-profile-root .bg-white\\/40,
.vbiz-profile-root .bg-white\\/80,
.vbiz-profile-root .bg-white\\/95,
.vbiz-profile-root .bg-zinc-100,
.vbiz-profile-root .bg-zinc-50,
.vbiz-profile-root .dark\\:bg-zinc-900\\/50,
.vbiz-profile-root .dark\\:bg-zinc-900\\/30,
.vbiz-profile-root .dark\\:bg-zinc-900\\/80,
.vbiz-profile-root .dark\\:bg-zinc-800\\/80,
.vbiz-profile-root .dark\\:bg-\\[\\#031327\\]\\/80,
.vbiz-profile-root .dark\\:bg-\\[\\#031327\\]\\/40,
.vbiz-profile-root .dark\\:bg-\\[\\#031327\\]\\/60 {
  background-color: color-mix(in srgb, var(--vbiz-surface) 92%, transparent) !important;
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
  color: var(--vbiz-title, var(--vbiz-text)) !important;
}
.vbiz-pin,
.vbiz-eyebrow {
  color: var(--vbiz-pin, var(--vbiz-accent)) !important;
}
.vbiz-description {
  color: var(--vbiz-description, var(--vbiz-text-muted)) !important;
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
}
.vbiz-modal-panel {
  background-color: var(--vbiz-modal-bg, var(--vbiz-surface)) !important;
  border-color: var(--vbiz-modal-border, var(--vbiz-border)) !important;
  color: var(--vbiz-text) !important;
  border-radius: 1rem !important;
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
.vbiz-card-pill {
  background-color: color-mix(in srgb, var(--vbiz-surface) 96%, white) !important;
  color: var(--vbiz-secondary) !important;
  border: 1px solid color-mix(in srgb, var(--vbiz-accent) 30%, transparent) !important;
  border-radius: var(--vbiz-btn-radius, 9999px) !important;
}
.vbiz-card-pill,
.vbiz-card-pill * {
  color: var(--vbiz-secondary) !important;
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
`.trim()
