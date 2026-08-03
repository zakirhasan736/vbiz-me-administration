import type {
  ProfileSettingsAppearance,
  ProfileSettingsData,
  ProfileSettingsResponse,
  ProfileSettingsThemeConfig,
} from '@/interfaces/api/profileSettings.interface'
import { getDefaultThemeConfig, type CardThemeConfig, type ProfileTemplateId } from '@/lib/theme/cardThemeContract'
import { brandColorsFromThemeConfig, resolveCardThemeConfig } from '@/lib/theme/resolveCardTheme'
import type { VCardAppearance } from '@/types/vcard'

function unwrapSettingsPayload(
  raw: ProfileSettingsResponse | ProfileSettingsData | null | undefined
): ProfileSettingsData | null {
  if (!raw || typeof raw !== 'object') return null
  if ('data' in raw && raw.data && typeof raw.data === 'object') return raw.data
  if ('theme_config' in raw || 'appearance' in raw) return raw as ProfileSettingsData
  return null
}

export type MappedProfileSettings = {
  themeConfig: CardThemeConfig
  appearance: Partial<VCardAppearance>
  hasThemeConfig: boolean
}

function normalizeTemplate(value: unknown, fallback: ProfileTemplateId): ProfileTemplateId {
  if (value === 'v1' || value === 'v2' || value === 'v3') return value
  if (value === 'dynamic' || value === 'first') return 'v1'
  if (value === 'second') return 'v2'
  if (value === 'default') return 'v3'
  return fallback
}

function mapButtonStyleToAppearance(style: string | undefined): string {
  if (!style) return 'solid'
  if (style === 'filled') return 'solid'
  if (style === 'outlined') return 'outline'
  return style
}

/**
 * Map settings payload (or null) onto our theme contract.
 * Uses template palettes (our current colors) as the base; API values override when valid.
 *
 * Expected `theme_config.components.button` shape:
 *   { primary, secondary, accent } — each with style + light/dark colors
 * Social icons are separate: style, fill (bg), foreground (icon color).
 */
export function mapProfileSettings(
  raw: ProfileSettingsResponse | ProfileSettingsData | null | undefined,
  template: ProfileTemplateId = 'v3'
): MappedProfileSettings {
  const payload = unwrapSettingsPayload(raw)
  const appearanceRaw: ProfileSettingsAppearance = payload?.appearance ?? {}
  const themeRaw: ProfileSettingsThemeConfig = payload?.theme_config ?? {}

  const resolvedTemplate = normalizeTemplate(appearanceRaw.profileTemplate, template)
  const defaults = getDefaultThemeConfig(resolvedTemplate)

  const themeConfig = resolveCardThemeConfig(
    {
      version: themeRaw.version,
      themeMode: themeRaw.themeMode,
      colors: themeRaw.colors,
      components: themeRaw.components,
      button: themeRaw.button,
      socialIcon: themeRaw.socialIcon,
      appearance: {
        profileTemplate: resolvedTemplate,
        layoutStyle: appearanceRaw.layoutStyle,
        buttonStyle: appearanceRaw.buttonStyle,
        cornerStyle: appearanceRaw.cornerStyle,
      },
    },
    resolvedTemplate
  )

  const appearance: Partial<VCardAppearance> = {
    profileTemplate: resolvedTemplate,
    layoutStyle:
      typeof appearanceRaw.layoutStyle === 'string' ? appearanceRaw.layoutStyle : defaults.appearance.layoutStyle,
    buttonStyle: mapButtonStyleToAppearance(appearanceRaw.buttonStyle ?? themeConfig.appearance.buttonStyle),
    cornerStyle:
      typeof appearanceRaw.cornerStyle === 'string' ? appearanceRaw.cornerStyle : defaults.appearance.cornerStyle,
  }

  const hasThemeConfig = Boolean(payload?.theme_config && typeof payload.theme_config === 'object')

  return { themeConfig, appearance, hasThemeConfig }
}

export { brandColorsFromThemeConfig }
