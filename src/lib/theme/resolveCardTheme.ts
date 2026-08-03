import {
  DEFAULT_THEME_COLORS,
  cornerStyleToRadius,
  defaultButtonComponents,
  getDefaultThemeConfig,
  type ButtonComponents,
  type CardThemeConfig,
  type ComponentAppearance,
  type ComponentModeColors,
  type ComponentStyle,
  type CornerStyle,
  type GlobalThemeColors,
  type ProfileTemplateId,
  type SocialIconComponent,
  type ThemeColorSet,
  type ThemeMode,
} from '@/lib/theme/cardThemeContract'

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const COMPONENT_STYLES = new Set<ComponentStyle>(['filled', 'outlined', 'ghost', 'soft', 'glass'])

function isColorString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  return (
    HEX_RE.test(v) ||
    v.startsWith('rgb') ||
    v.startsWith('hsl') ||
    v.startsWith('color-mix') ||
    v.startsWith('var(') ||
    v === 'primary' ||
    v === 'secondary' ||
    v === 'accent' ||
    v === 'auto'
  )
}

/** Relative luminance (WCAG) for a hex color; returns 0–1. */
function hexLuminance(hex: string): number {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * Pick a readable foreground (black/white) for a given background color.
 * Used to guarantee contrast when an owner changes icon/fill color.
 */
export function readableForeground(background: string, dark = '#0b0b0d', light = '#ffffff'): string {
  if (!isColorString(background) || !HEX_RE.test(background.trim())) {
    return light
  }
  return hexLuminance(background) > 0.55 ? dark : light
}

/**
 * Ensure a fill has a compatible, contrasting companion.
 * If `foreground` is missing/auto, derive it from the fill so contrast is guaranteed.
 */
export function ensureContrastPair(fill: string, foreground?: string): { fill: string; foreground: string } {
  if (foreground && foreground !== 'auto' && isColorString(foreground)) {
    return { fill, foreground }
  }
  return { fill, foreground: readableForeground(fill) }
}

function mergeColorSet(base: ThemeColorSet, override?: Partial<ThemeColorSet> | null): ThemeColorSet {
  if (!override) return { ...base }
  const next: ThemeColorSet = { ...base }
  for (const key of Object.keys(base) as (keyof ThemeColorSet)[]) {
    const value = override[key]
    if (isColorString(value)) next[key] = value
  }
  return next
}

function mergeColors(raw: unknown, base: GlobalThemeColors = DEFAULT_THEME_COLORS): GlobalThemeColors {
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<GlobalThemeColors> & { themeMode?: ThemeMode }
  const defaultMode: ThemeMode =
    r.defaultMode === 'light' || r.defaultMode === 'dark'
      ? r.defaultMode
      : r.themeMode === 'light' || r.themeMode === 'dark'
        ? r.themeMode
        : (base.defaultMode ?? 'dark')
  return {
    defaultMode,
    light: mergeColorSet(base.light, r.light),
    dark: mergeColorSet(base.dark, r.dark),
  }
}

function normalizeStyle(value: unknown, fallback: ComponentStyle): ComponentStyle {
  if (typeof value === 'string' && COMPONENT_STYLES.has(value as ComponentStyle)) {
    return value as ComponentStyle
  }
  if (value === 'outline') return 'outlined'
  if (value === 'solid') return 'filled'
  return fallback
}

function mergeModeColors(
  base: ComponentModeColors,
  override?: Partial<ComponentModeColors> | null
): ComponentModeColors {
  if (!override) return { ...base }
  return {
    fill: isColorString(override.fill) ? override.fill : base.fill,
    foreground: isColorString(override.foreground) ? override.foreground : base.foreground,
    borderColor: isColorString(override.borderColor) ? override.borderColor : base.borderColor,
    hoverOverlay: isColorString(override.hoverOverlay) ? override.hoverOverlay : base.hoverOverlay,
  }
}

function mergeComponentAppearance(base: ComponentAppearance, raw: unknown): ComponentAppearance {
  if (!raw || typeof raw !== 'object') return base
  const r = raw as {
    style?: unknown
    colors?: { light?: Partial<ComponentModeColors>; dark?: Partial<ComponentModeColors> }
  }
  return {
    style: normalizeStyle(r.style, base.style),
    colors: {
      light: mergeModeColors(base.colors.light, r.colors?.light),
      dark: mergeModeColors(base.colors.dark, r.colors?.dark),
    },
  }
}

function mergeSocialIcon(
  base: SocialIconComponent,
  raw: unknown,
  cornerStyle: CornerStyle = 'round'
): SocialIconComponent {
  const appearance = mergeComponentAppearance(base, raw)
  if (!raw || typeof raw !== 'object') {
    return {
      ...base,
      ...appearance,
      cornerRadius: cornerStyleToRadius(cornerStyle),
    }
  }
  const r = raw as Partial<SocialIconComponent>
  return {
    ...appearance,
    iconSize: typeof r.iconSize === 'number' ? r.iconSize : base.iconSize,
    size: typeof r.size === 'number' ? r.size : base.size,
    cornerRadius:
      typeof r.cornerRadius === 'number' || typeof r.cornerRadius === 'string'
        ? r.cornerRadius
        : cornerStyleToRadius(cornerStyle),
  }
}

function mergeButtons(raw: unknown, base: ButtonComponents = defaultButtonComponents()): ButtonComponents {
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<ButtonComponents> & ComponentAppearance & Record<string, unknown>

  let buttons: ButtonComponents = {
    primary: { ...base.primary },
    secondary: { ...base.secondary },
    accent: { ...base.accent },
  }

  // 1) Per-role: primary | secondary | accent (each can send its own style + colors)
  if (r.primary) buttons.primary = mergeComponentAppearance(base.primary, r.primary)
  if (r.secondary) buttons.secondary = mergeComponentAppearance(base.secondary, r.secondary)
  if (r.accent) buttons.accent = mergeComponentAppearance(base.accent, r.accent)

  // 2) Root-level style → all button roles (settings UI global button type)
  if ('style' in r && r.style != null) {
    const style = normalizeStyle(r.style, buttons.primary.style)
    buttons = applyComponentStyleToButtons(buttons, style)
  }

  // 3) Root-level colors → all button roles
  if ('colors' in r && r.colors && typeof r.colors === 'object') {
    const shared = { colors: r.colors as ComponentAppearance['colors'] }
    buttons = {
      primary: mergeComponentAppearance(buttons.primary, shared),
      secondary: mergeComponentAppearance(buttons.secondary, shared),
      accent: mergeComponentAppearance(buttons.accent, shared),
    }
  }

  // 4) Legacy: unstructured object → accent only
  const hasStructuredKeys =
    r.primary || r.secondary || r.accent || ('style' in r && r.style != null) || ('colors' in r && r.colors)
  if (!hasStructuredKeys) {
    return {
      primary: base.primary,
      secondary: base.secondary,
      accent: mergeComponentAppearance(base.accent, r),
    }
  }

  return buttons
}

/** Map appearance.buttonStyle (solid | outline | glass | soft) → component style. */
export function appearanceButtonStyleToComponentStyle(value: unknown): ComponentStyle | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'solid') return 'filled'
  if (v === 'outline') return 'outlined'
  if (COMPONENT_STYLES.has(v as ComponentStyle)) return v as ComponentStyle
  return null
}

function applyComponentStyleToButtons(buttons: ButtonComponents, style: ComponentStyle): ButtonComponents {
  return {
    primary: { ...buttons.primary, style },
    secondary: { ...buttons.secondary, style },
    accent: { ...buttons.accent, style },
  }
}

function buttonRootStyleSent(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const r = raw as { style?: unknown }
  return r.style != null && r.style !== undefined
}

/**
 * Merge a raw `theme_config` from the API with safe defaults.
 * Returns a fully-populated, type-safe config — never throws on bad input.
 */
export function resolveCardThemeConfig(raw: unknown, template: ProfileTemplateId = 'v3'): CardThemeConfig {
  const defaults = getDefaultThemeConfig(template)
  if (!raw || typeof raw !== 'object') return defaults

  const r = raw as Partial<CardThemeConfig> & {
    button?: unknown
    socialIcon?: unknown
    components?: {
      button?: unknown
      socialIcon?: unknown
    }
    appearance?: Partial<CardThemeConfig['appearance']>
  }

  const buttonSource = r.components?.button ?? r.button
  const socialSource = r.components?.socialIcon ?? r.socialIcon

  const appearance = {
    ...defaults.appearance,
    ...(r.appearance && typeof r.appearance === 'object' ? r.appearance : {}),
    profileTemplate: template,
  }

  const cornerStyle: CornerStyle =
    appearance.cornerStyle === 'square' ||
    appearance.cornerStyle === 'soft' ||
    appearance.cornerStyle === 'round' ||
    appearance.cornerStyle === 'pill'
      ? appearance.cornerStyle
      : defaults.appearance.cornerStyle

  let buttons = mergeButtons(buttonSource, defaults.components.button)

  // appearance.buttonStyle (solid | outline | glass | soft) when components.button.style not sent
  const appearanceStyle = appearanceButtonStyleToComponentStyle(appearance.buttonStyle)
  if (appearanceStyle && !buttonRootStyleSent(buttonSource)) {
    buttons = applyComponentStyleToButtons(buttons, appearanceStyle)
  }

  const socialIcon = mergeSocialIcon(defaults.components.socialIcon, socialSource, cornerStyle)

  return {
    version: typeof r.version === 'number' ? r.version : 1,
    colors: mergeColors(
      {
        ...(r.colors && typeof r.colors === 'object' ? r.colors : {}),
        themeMode: (r as { themeMode?: ThemeMode }).themeMode,
      },
      defaults.colors
    ),
    components: {
      button: buttons,
      socialIcon,
    },
    appearance: {
      profileTemplate: template,
      layoutStyle:
        appearance.layoutStyle === 'hero' || appearance.layoutStyle === 'classic'
          ? appearance.layoutStyle
          : defaults.appearance.layoutStyle,
      buttonStyle:
        appearance.buttonStyle === 'solid' ||
        appearance.buttonStyle === 'soft' ||
        appearance.buttonStyle === 'outline' ||
        appearance.buttonStyle === 'glass'
          ? appearance.buttonStyle
          : defaults.appearance.buttonStyle,
      cornerStyle,
    },
  }
}

/** Returns true when the backend actually provided a usable theme_config. */
export function hasDynamicTheme(raw: unknown): boolean {
  return Boolean(raw && typeof raw === 'object' && 'colors' in (raw as Record<string, unknown>))
}

/** Active-mode brand colors for ResolvedProfileDesign. */
export function brandColorsFromThemeConfig(
  themeConfig: CardThemeConfig,
  mode: ThemeMode
): { primaryColor: string; accentColor: string } {
  const set = mode === 'light' ? themeConfig.colors.light : themeConfig.colors.dark
  return {
    primaryColor: set.primary,
    accentColor: set.accent,
  }
}
