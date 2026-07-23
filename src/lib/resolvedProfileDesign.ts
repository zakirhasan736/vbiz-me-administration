import { resolveVCardAppearance } from '@/lib/vcardDesignDefaults'
import type { DesignSettingsState, ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { VCardAppearance, VCardData, VCardRecord, VCardTheme } from '@/types/vcard'
import type { CSSProperties } from 'react'

export type ResolvedProfileDesign = {
  primaryColor: string
  accentColor: string
  fontFamily: string
  profileTemplate: ProfileTemplateId
  layoutStyle: string
  buttonStyle: string
  cornerStyle: string
  darkMode: boolean
}

const FONT_STACKS: Record<string, string> = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  outfit: "'Outfit', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  serif: "'Playfair Display', ui-serif, Georgia, serif",
}

export function fontFamilyToStack(id: string): string {
  return FONT_STACKS[id] ?? FONT_STACKS.inter
}

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
      return 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
    case 'outline':
      return 'bg-transparent border-2 hover:bg-black/5 dark:hover:bg-white/5'
    case 'soft':
      return 'border border-transparent hover:opacity-90'
    case 'solid':
    default:
      return 'text-white hover:opacity-90 shadow-sm'
  }
}

/** Merge account defaults with per-card theme + appearance (card wins when set). */
export function resolveProfileDesign(
  designSettings: DesignSettingsState,
  cardTheme?: Partial<VCardTheme> | null,
  cardAppearance?: Partial<VCardAppearance> | null
): ResolvedProfileDesign {
  const appearance = resolveVCardAppearance(designSettings, cardAppearance)
  return {
    primaryColor: cardTheme?.primaryColor || designSettings.vcardPrimaryColor || '#6366f1',
    accentColor: cardTheme?.accentColor || designSettings.vcardAccentColor || '#f43f5e',
    fontFamily: cardTheme?.fontFamily || designSettings.fontFamily || 'inter',
    profileTemplate: appearance.profileTemplate,
    layoutStyle: appearance.layoutStyle,
    buttonStyle: appearance.buttonStyle,
    cornerStyle: appearance.cornerStyle,
    darkMode: cardTheme?.darkMode ?? true,
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
  designSettings: DesignSettingsState
): ResolvedProfileDesign {
  return resolveProfileDesign(designSettings, data.theme, data.appearance)
}

export function designToCssVars(design: ResolvedProfileDesign): CSSProperties {
  return {
    ['--vbiz-primary' as string]: design.primaryColor,
    ['--vbiz-accent' as string]: design.accentColor,
    ['--vbiz-radius' as string]: cornerStyleToRadius(design.cornerStyle),
    fontFamily: fontFamilyToStack(design.fontFamily),
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
    ['--vbiz-note-text' as string]: `color-mix(in srgb, ${brand} 82%, black)`,
    ['--vbiz-note-muted' as string]: `color-mix(in srgb, ${brand} 48%, #525252)`,
    ['--vbiz-note-placeholder' as string]: `color-mix(in srgb, ${brand} 35%, #78716c)`,
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
