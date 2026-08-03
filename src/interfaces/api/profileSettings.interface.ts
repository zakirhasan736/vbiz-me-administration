/** Payload from `GET /profiles/{id}/settings` (theme contract format). */

export type ProfileSettingsAppearance = {
  profileTemplate?: string
  layoutStyle?: string
  buttonStyle?: string
  cornerStyle?: string
}

export type ProfileSettingsColorSet = {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  surface?: string
  text?: string
  textMuted?: string
  border?: string
  overlay?: string
}

export type ProfileSettingsComponentModeColors = {
  fill?: string
  foreground?: string
  borderColor?: string
  hoverOverlay?: string
}

export type ProfileSettingsComponentAppearance = {
  style?: string
  colors?: {
    light?: ProfileSettingsComponentModeColors
    dark?: ProfileSettingsComponentModeColors
  }
  iconSize?: number
  size?: number
  cornerRadius?: number | string
}

/** Three button roles — each has its own style + light/dark colors. */
export type ProfileSettingsButtonComponents = {
  primary?: ProfileSettingsComponentAppearance
  secondary?: ProfileSettingsComponentAppearance
  accent?: ProfileSettingsComponentAppearance
}

export type ProfileSettingsThemeConfig = {
  version?: number
  themeMode?: 'light' | 'dark'
  colors?: {
    light?: ProfileSettingsColorSet
    dark?: ProfileSettingsColorSet
    defaultMode?: 'light' | 'dark'
  }
  components?: {
    button?: ProfileSettingsButtonComponents | ProfileSettingsComponentAppearance
    socialIcon?: ProfileSettingsComponentAppearance
  }
  /** Legacy flat shape (also accepted) */
  button?: ProfileSettingsComponentAppearance & Record<string, unknown>
  socialIcon?: ProfileSettingsComponentAppearance & Record<string, unknown>
}

export type ProfileSettingsData = {
  appearance?: ProfileSettingsAppearance
  theme_config?: ProfileSettingsThemeConfig
}

export type ProfileSettingsResponse = ProfileSettingsData & {
  success?: boolean
  data?: ProfileSettingsData
}
