import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { VCardTheme } from '@/types/vcard'

/** Static palette per profile template (matches reference template repos). */
export const STATIC_PROFILE_THEMES: Record<ProfileTemplateId, VCardTheme & { accentDark?: string }> = {
  /** first-template / dynamic card */
  v1: {
    primaryColor: '#dcc969',
    accentColor: '#dcc969',
    darkMode: true,
    fontFamily: 'inter',
  },
  /** secopnd-template */
  v2: {
    primaryColor: '#eab308',
    accentColor: '#eab308',
    darkMode: true,
    fontFamily: 'inter',
  },
  /** vbiz-profile-redesign (default) */
  v3: {
    primaryColor: '#eed677',
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
    accentColor: theme.accentColor,
    darkMode: theme.darkMode,
    fontFamily: theme.fontFamily,
  }
}
