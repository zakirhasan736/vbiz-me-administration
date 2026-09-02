import { TEMPLATE_THEME_COLORS } from '@/lib/theme/cardThemeContract'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { VCardTheme } from '@/types/vcard'

/** Static palette per profile template (matches reference template repos). */
export const STATIC_PROFILE_THEMES: Record<ProfileTemplateId, VCardTheme & { accentDark?: string }> = {
  /** first-template / dynamic card */
  v1: {
    primaryColor: '#dcc969',
    secondaryColor: TEMPLATE_THEME_COLORS.v1.dark.secondary,
    accentColor: '#dcc969',
    darkMode: true,
    fontFamily: 'inter',
  },
  /** secopnd-template */
  v2: {
    primaryColor: '#eab308',
    secondaryColor: TEMPLATE_THEME_COLORS.v2.dark.secondary,
    accentColor: '#eab308',
    darkMode: true,
    fontFamily: 'inter',
  },
  /** vbiz-profile-redesign (default) */
  v3: {
    primaryColor: '#eed677',
    secondaryColor: TEMPLATE_THEME_COLORS.v3.dark.secondary,
    accentColor: '#eed677',
    accentDark: '#cca43b',
    darkMode: true,
    fontFamily: 'inter',
  },
}

export function getStaticProfileTheme(template: ProfileTemplateId): VCardTheme {
  const theme = STATIC_PROFILE_THEMES[template]
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    darkMode: theme.darkMode,
    fontFamily: theme.fontFamily,
  }
}
