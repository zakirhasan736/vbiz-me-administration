import { getStaticProfileTheme } from '@/lib/staticProfileThemes'
import { ALL_DISPLAY_FIELD_KEYS } from '@/lib/vcardDisplaySettings'
import type { DesignSettingsState, ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { VCardAppearance, VCardData, VCardTheme } from '@/types/vcard'
import { createDefaultDisplaySettings } from '@/types/vcardDisplaySettings'

export function appearanceFromDesignSettings(design: DesignSettingsState): VCardAppearance {
  return {
    profileTemplate: design.profileTemplate ?? 'v3',
    layoutStyle: design.layoutStyle || 'classic',
    buttonStyle: design.buttonStyle || 'solid',
    cornerStyle: design.cornerStyle || 'round',
    buttonShadow: 'none',
  }
}

export function themeFromDesignSettings(design: DesignSettingsState): VCardTheme {
  const template = design.profileTemplate ?? 'v3'
  return getStaticProfileTheme(template)
}

/** Snapshot account profile Template + Appearance for a new vCard draft. */
export function designSettingsToVCardDefaults(
  design: DesignSettingsState
): Pick<VCardData, 'theme' | 'appearance' | 'displaySettings'> {
  return {
    theme: themeFromDesignSettings(design),
    appearance: appearanceFromDesignSettings(design),
    displaySettings: createDefaultDisplaySettings([...ALL_DISPLAY_FIELD_KEYS]),
  }
}

export function resolveVCardAppearance(
  design: DesignSettingsState,
  cardAppearance?: Partial<VCardAppearance> | null
): VCardAppearance {
  const account = appearanceFromDesignSettings(design)
  if (!cardAppearance) return account
  return {
    profileTemplate: (cardAppearance.profileTemplate as ProfileTemplateId) ?? account.profileTemplate,
    layoutStyle: cardAppearance.layoutStyle ?? account.layoutStyle,
    buttonStyle: cardAppearance.buttonStyle ?? account.buttonStyle,
    cornerStyle: cardAppearance.cornerStyle ?? account.cornerStyle,
    buttonShadow: cardAppearance.buttonShadow ?? account.buttonShadow,
  }
}
