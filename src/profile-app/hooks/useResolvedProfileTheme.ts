'use client'

import type { MappedProfileSettings } from '@/lib/api/profileSettings/mapProfileSettings'
import { getDefaultThemeConfig, type CardThemeConfig } from '@/lib/theme/cardThemeContract'
import { useGetProfileSettingsQuery } from '@/redux/api/profileSettingsApi'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { VCardAppearance } from '@/types/vcard'
import { useMemo } from 'react'

type UseResolvedProfileThemeOptions = {
  profileId: string
  template: ProfileTemplateId
  /** SSR-prefetched settings (first paint). */
  initialSettings?: MappedProfileSettings | null
  /** Fallback when settings API unavailable — `theme_config` on myCard. */
  cardThemeConfig?: CardThemeConfig | null
}

/**
 * Resolves theme on every visit and when settings change in the back office.
 * Priority: live API → SSR prefetch → myCard theme_config → template defaults.
 */
export function useResolvedProfileTheme({
  profileId,
  template,
  initialSettings,
  cardThemeConfig,
}: UseResolvedProfileThemeOptions) {
  const id = profileId.trim()

  const { data: liveSettings } = useGetProfileSettingsQuery(
    { profileId: id, template },
    {
      skip: !id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  )

  return useMemo(() => {
    const mapped = liveSettings ?? initialSettings

    if (mapped?.themeConfig) {
      return {
        themeConfig: mapped.themeConfig,
        appearance: (mapped.appearance ?? {}) as Partial<VCardAppearance>,
        fromApi: mapped.hasThemeConfig || Boolean(liveSettings),
        source: liveSettings ? ('live' as const) : initialSettings ? ('ssr' as const) : ('mapped' as const),
      }
    }

    if (cardThemeConfig) {
      return {
        themeConfig: cardThemeConfig,
        appearance: {} as Partial<VCardAppearance>,
        fromApi: true,
        source: 'card' as const,
      }
    }

    return {
      themeConfig: getDefaultThemeConfig(template),
      appearance: {} as Partial<VCardAppearance>,
      fromApi: false,
      source: 'defaults' as const,
    }
  }, [liveSettings, initialSettings, cardThemeConfig, template])
}
