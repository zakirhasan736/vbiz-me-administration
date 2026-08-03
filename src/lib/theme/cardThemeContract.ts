/**
 * vBiz Me theme contract (frontend defaults).
 * Format matches the settings schema; colors are our current template palettes.
 * No settings API — templates use these built-in light/dark defaults.
 */

export type ThemeMode = 'light' | 'dark'
export type ProfileTemplateId = 'v1' | 'v2' | 'v3'

/** Role token or raw CSS color. */
export type ColorToken = 'primary' | 'secondary' | 'accent' | 'auto' | (string & {})

/** Component visual style (contract options.componentStyle / buttonStyle). */
export type ComponentStyle = 'filled' | 'outlined' | 'ghost' | 'soft' | 'glass'

export type CornerStyle = 'square' | 'soft' | 'round' | 'pill'

/** Page palette for one mode. */
export type ThemeColorSet = {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  overlay: string
}

export type GlobalThemeColors = {
  light: ThemeColorSet
  dark: ThemeColorSet
  defaultMode?: ThemeMode
}

/** Per-mode colors for a button or social icon. */
export type ComponentModeColors = {
  fill: ColorToken
  foreground: ColorToken
  borderColor: ColorToken
  hoverOverlay?: string
}

/** One component (button role or social icon). */
export type ComponentAppearance = {
  style: ComponentStyle
  colors: {
    light: ComponentModeColors
    dark: ComponentModeColors
  }
}

export type ButtonComponents = {
  primary: ComponentAppearance
  secondary: ComponentAppearance
  accent: ComponentAppearance
}

export type SocialIconComponent = ComponentAppearance & {
  iconSize: number
  size: number
  cornerRadius: number | string
}

export type CardThemeConfig = {
  version: 1
  colors: GlobalThemeColors
  components: {
    button: ButtonComponents
    socialIcon: SocialIconComponent
  }
  appearance: {
    profileTemplate: ProfileTemplateId
    layoutStyle: 'classic' | 'hero'
    buttonStyle: 'solid' | 'soft' | 'outline' | 'glass'
    cornerStyle: CornerStyle
  }
}

/* ----------------------------- Template static palettes ----------------------------- */

export const TEMPLATE_STATIC_PALETTE = {
  v1: { primaryColor: '#dcc969', accentColor: '#dcc969', darkMode: true, fontFamily: 'inter' },
  v2: { primaryColor: '#eab308', accentColor: '#eab308', darkMode: true, fontFamily: 'inter' },
  v3: {
    primaryColor: '#eed677',
    accentColor: '#eed677',
    accentDark: '#cca43b',
    darkMode: true,
    fontFamily: 'inter',
  },
} as const

/* ----------------------------- Page colors (our current defaults) ----------------------------- */

function pageColors(primary: string, accentLight: string, accentDark: string): GlobalThemeColors {
  return {
    defaultMode: 'dark',
    light: {
      primary,
      secondary: '#0f2c4d',
      accent: accentLight,
      background: '#ffffff',
      surface: '#f4f5f7',
      text: '#0b0b0d',
      textMuted: '#52525b',
      border: '#e4e4e7',
      overlay: 'rgba(0,0,0,0.35)',
    },
    dark: {
      primary,
      secondary: '#0f2c4d',
      accent: accentDark,
      background: '#020914',
      surface: '#0b1626',
      text: '#f4f4f5',
      textMuted: '#a1a1aa',
      border: '#1e293b',
      overlay: 'rgba(0,0,0,0.55)',
    },
  }
}

/** v3 page defaults (contract defaults.theme_config.colors). */
export const DEFAULT_THEME_COLORS: GlobalThemeColors = pageColors('#eed677', '#cca43b', '#eed677')

export const TEMPLATE_THEME_COLORS: Record<ProfileTemplateId, GlobalThemeColors> = {
  v1: {
    defaultMode: 'dark',
    light: {
      primary: '#dcc969',
      secondary: '#1a1a1a',
      accent: '#dcc969',
      background: '#ffffff',
      surface: '#f8f8f6',
      text: '#111111',
      textMuted: '#525252',
      border: '#e5e5e5',
      overlay: 'rgba(0,0,0,0.35)',
    },
    dark: {
      primary: '#dcc969',
      secondary: '#0a0a0a',
      accent: '#dcc969',
      background: '#0a0a0a',
      surface: '#141414',
      text: '#fafafa',
      textMuted: '#a3a3a3',
      border: '#262626',
      overlay: 'rgba(0,0,0,0.55)',
    },
  },
  v2: {
    defaultMode: 'dark',
    light: {
      primary: '#eab308',
      secondary: '#18181b',
      accent: '#eab308',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#09090b',
      textMuted: '#52525b',
      border: '#e4e4e7',
      overlay: 'rgba(0,0,0,0.35)',
    },
    dark: {
      primary: '#eab308',
      secondary: '#09090b',
      accent: '#eab308',
      background: '#09090b',
      surface: '#18181b',
      text: '#fafafa',
      textMuted: '#a1a1aa',
      border: '#27272a',
      overlay: 'rgba(0,0,0,0.55)',
    },
  },
  v3: DEFAULT_THEME_COLORS,
}

/* ----------------------------- Component defaults ----------------------------- */

function roleButton(
  style: ComponentStyle,
  fill: ColorToken,
  /** Brand concept: dark blue (secondary) on gold/primary fills — not white. */
  foreground: ColorToken = 'secondary',
  hoverLight = 'rgba(0,0,0,0.08)',
  hoverDark = 'rgba(255,255,255,0.10)'
): ComponentAppearance {
  return {
    style,
    colors: {
      light: { fill, foreground, borderColor: fill === 'auto' ? 'auto' : fill, hoverOverlay: hoverLight },
      dark: { fill, foreground, borderColor: fill === 'auto' ? 'auto' : fill, hoverOverlay: hoverDark },
    },
  }
}

/** Three button types — each has its own style + light/dark colors. */
export function defaultButtonComponents(): ButtonComponents {
  return {
    // Filled brand CTAs: gold/primary fill + dark-blue (secondary) icons/text
    primary: roleButton('filled', 'primary', 'secondary'),
    // Outline with opacity surface (readable in light + dark — not gold-on-transparent).
    secondary: {
      style: 'outlined',
      colors: {
        light: {
          fill: 'accent',
          foreground: 'auto',
          borderColor: 'accent',
          hoverOverlay: 'rgba(0,0,0,0.06)',
        },
        dark: {
          fill: 'secondary',
          foreground: 'auto',
          borderColor: 'accent',
          hoverOverlay: 'rgba(255,255,255,0.10)',
        },
      },
    },
    accent: roleButton('filled', 'accent', 'secondary'),
  }
}

/** Social icons: accent (gold) bg + secondary (dark blue) icon — prior brand concept. */
export function defaultSocialIconComponent(): SocialIconComponent {
  return {
    style: 'filled',
    iconSize: 18,
    size: 40,
    cornerRadius: 9999,
    colors: {
      light: {
        fill: 'accent',
        foreground: 'secondary',
        borderColor: 'auto',
        hoverOverlay: 'rgba(0,0,0,0.10)',
      },
      dark: {
        fill: 'accent',
        foreground: 'secondary',
        borderColor: 'auto',
        hoverOverlay: 'rgba(255,255,255,0.12)',
      },
    },
  }
}

export function cornerStyleToRadius(cornerStyle: CornerStyle): number {
  switch (cornerStyle) {
    case 'square':
      return 0
    case 'soft':
      return 8
    case 'round':
      return 16
    case 'pill':
      return 9999
    default:
      return 16
  }
}

/** Built-in theme for a template — our current colors, contract format. */
export function getDefaultThemeConfig(template: ProfileTemplateId = 'v3'): CardThemeConfig {
  const colors = TEMPLATE_THEME_COLORS[template] ?? DEFAULT_THEME_COLORS
  const buttons = defaultButtonComponents()
  const socialIcon = defaultSocialIconComponent()

  return {
    version: 1,
    colors,
    components: {
      button: {
        primary: buttons.primary,
        secondary: buttons.secondary,
        accent: buttons.accent,
      },
      socialIcon,
    },
    appearance: {
      profileTemplate: template,
      layoutStyle: 'classic',
      buttonStyle: 'solid',
      cornerStyle: 'round',
    },
  }
}

/** @deprecated use getDefaultThemeConfig */
export const DEFAULT_CARD_THEME_CONFIG = getDefaultThemeConfig('v3')

/** Legacy aliases used by older helpers. */
export type ElementStyle = ComponentStyle
export type ElementAppearance = ComponentAppearance & {
  cornerRadius?: number | string
  glass?: boolean
  shadow?: string
  borderWidth?: number
  fill?: ColorToken
  foreground?: ColorToken
  modeColors?: { light?: ComponentModeColors; dark?: ComponentModeColors }
}
export type SocialIconAppearance = SocialIconComponent
export type ModeElementColors = ComponentModeColors
export const DEFAULT_BUTTON_APPEARANCE = defaultButtonComponents().accent
export const DEFAULT_SOCIAL_ICON_APPEARANCE = defaultSocialIconComponent()
