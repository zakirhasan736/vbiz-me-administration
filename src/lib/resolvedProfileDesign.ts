import { fontFamilyToStack } from '@/lib/fonts'
import { getStaticProfileTheme } from '@/lib/staticProfileThemes'
import type { CardThemeConfig, ThemeMode } from '@/lib/theme/cardThemeContract'
import { brandColorsFromThemeConfig } from '@/lib/theme/resolveCardTheme'
import { resolveVCardAppearance } from '@/lib/vcardDesignDefaults'
import type { DesignSettingsState, ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { VCardAppearance, VCardData, VCardRecord, VCardTheme } from '@/types/vcard'
import type { CSSProperties } from 'react'

export type ResolvedProfileDesign = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  profileTemplate: ProfileTemplateId
  layoutStyle: string
  buttonStyle: string
  cornerStyle: string
  darkMode: boolean
}

export { fontFamilyToStack } from '@/lib/fonts'

export function cornerStyleToRadius(cornerStyle: string): string {
  switch (cornerStyle) {
    case 'square':
      return '0px'
    case 'soft':
      return '8px'
    case 'round':
      return '16px'
    case 'pill':
      return '9999px'
    default:
      return '16px'
  }
}

export function buttonStyleClasses(buttonStyle: string): string {
  switch (buttonStyle) {
    case 'glass':
      return 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 [&_svg]:text-white'
    case 'outline':
      return 'bg-transparent border-2 text-white hover:bg-white/10 [&_svg]:text-white'
    case 'soft':
      return 'border border-transparent hover:opacity-90'
    case 'solid':
    default:
      return 'text-white hover:opacity-90 shadow-sm [&_svg]:text-white'
  }
}

export type ResolveProfileDesignOptions = {
  themeConfig?: CardThemeConfig | null
  /** Which palette to read brand colors from (defaults to theme_config.defaultMode or dark). */
  colorMode?: ThemeMode
}

/**
 * Merge account defaults with per-card appearance.
 * Colors: template static palette as fallback, then smart placement from `theme_config`
 * (light/dark sets from `/profiles/{id}/settings`).
 * Typography: prefer per-card `theme.fontFamily` (preset id or Google family name).
 */
export function resolveProfileDesign(
  designSettings: DesignSettingsState,
  cardTheme?: Partial<VCardTheme> | null,
  cardAppearance?: Partial<VCardAppearance> | null,
  options?: ResolveProfileDesignOptions
): ResolvedProfileDesign {
  const appearance = resolveVCardAppearance(designSettings, cardAppearance)
  const staticTheme = getStaticProfileTheme(appearance.profileTemplate)
  const mode: ThemeMode =
    options?.colorMode ??
    options?.themeConfig?.colors.defaultMode ??
    (staticTheme.darkMode === false ? 'light' : 'dark')

  const configBrand = options?.themeConfig
    ? brandColorsFromThemeConfig(options.themeConfig, mode)
    : {
        primaryColor: staticTheme.primaryColor,
        secondaryColor: staticTheme.secondaryColor,
        accentColor: staticTheme.accentColor,
      }

  const livePrimary = typeof cardTheme?.primaryColor === 'string' ? cardTheme.primaryColor.trim() : ''
  const liveSecondary = typeof cardTheme?.secondaryColor === 'string' ? cardTheme.secondaryColor.trim() : ''
  const liveAccent = typeof cardTheme?.accentColor === 'string' ? cardTheme.accentColor.trim() : ''

  const fontFamily =
    (typeof cardTheme?.fontFamily === 'string' && cardTheme.fontFamily.trim()) ||
    (typeof options?.themeConfig?.appearance.fontFamily === 'string' &&
      options.themeConfig.appearance.fontFamily.trim()) ||
    staticTheme.fontFamily ||
    designSettings.fontFamily ||
    'inter'

  return {
    primaryColor: livePrimary || configBrand.primaryColor || staticTheme.primaryColor,
    secondaryColor: liveSecondary || configBrand.secondaryColor || staticTheme.secondaryColor,
    accentColor: liveAccent || configBrand.accentColor || staticTheme.accentColor,
    fontFamily,
    profileTemplate: appearance.profileTemplate,
    layoutStyle: appearance.layoutStyle,
    buttonStyle: appearance.buttonStyle,
    cornerStyle: appearance.cornerStyle,
    darkMode: mode === 'dark',
  }
}

export function resolveProfileDesignFromRecord(
  record: VCardRecord,
  designSettings: DesignSettingsState
): ResolvedProfileDesign {
  return resolveProfileDesign(designSettings, record.theme, record.appearance)
}

export function resolveProfileDesignFromData(
  data: VCardData,
  designSettings: DesignSettingsState,
  options?: ResolveProfileDesignOptions & { appearance?: Partial<VCardAppearance> | null }
): ResolvedProfileDesign {
  return resolveProfileDesign(designSettings, data.theme, options?.appearance ?? data.appearance, options)
}

export function designToCssVars(design: ResolvedProfileDesign): CSSProperties {
  const fontStack = fontFamilyToStack(design.fontFamily)
  return {
    ['--vbiz-font' as string]: fontStack,
    ['--font-sans' as string]: fontStack,
    ['--font-heading' as string]: fontStack,
    ['--vbiz-radius' as string]: cornerStyleToRadius(design.cornerStyle),
    fontFamily: fontStack,
  }
}

/** Sticky-note modal palette derived from card template + theme colors. */
export function notepadThemeFromDesign(design: ResolvedProfileDesign): CSSProperties {
  const isV1 = design.profileTemplate === 'v1'
  const brand = isV1 ? design.accentColor : design.primaryColor
  const accent = design.accentColor

  return {
    ['--vbiz-note-paper' as string]: `color-mix(in srgb, ${brand} 12%, white)`,
    ['--vbiz-note-paper-mid' as string]: `color-mix(in srgb, ${brand} 22%, white)`,
    ['--vbiz-note-paper-deep' as string]: `color-mix(in srgb, ${brand} 32%, white)`,
    ['--vbiz-note-surface' as string]: `color-mix(in srgb, ${brand} 8%, white)`,
    ['--vbiz-note-line' as string]: `color-mix(in srgb, ${accent} 38%, #bdbdbd)`,
    ['--vbiz-note-border' as string]: `color-mix(in srgb, ${accent} 42%, #d4d4d4)`,
    ['--vbiz-note-border-strong' as string]: `color-mix(in srgb, ${brand} 58%, #737373)`,
    ['--vbiz-note-text' as string]: '#09090b',
    ['--vbiz-note-muted' as string]: '#18181b',
    ['--vbiz-note-placeholder' as string]: '#52525b',
    ['--vbiz-note-tape' as string]: `color-mix(in srgb, ${accent} 28%, #e7e0cc)`,
    ['--vbiz-note-accent' as string]: brand,
    ['--vbiz-note-accent-hover' as string]: `color-mix(in srgb, ${brand} 88%, black)`,
    ['--vbiz-note-accent-text' as string]: '#ffffff',
    ['--vbiz-note-radius' as string]: isV1
      ? `max(${parseInt(cornerStyleToRadius(design.cornerStyle), 10) || 0}px, 10px)`
      : cornerStyleToRadius(design.cornerStyle),
    ['--vbiz-note-font' as string]: fontFamilyToStack(design.fontFamily),
  }
}
