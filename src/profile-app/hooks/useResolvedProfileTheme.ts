'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { MappedProfileSettings } from '@/lib/api/profileSettings/mapProfileSettings'
import {
  PUBLIC_CARD_LIVE_POLL_MS,
  subscribePublicCardSettingsSaved,
  useDocumentVisible,
} from '@/lib/publicCardLiveSync'
import { getDefaultThemeConfig, type CardThemeConfig } from '@/lib/theme/cardThemeContract'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import { profileSettingsApi, useGetProfileSettingsQuery } from '@/redux/features/profileSettings/profileSettings.api'
import type { VCardAppearance } from '@/types/vcard'
import { useEffect, useMemo } from 'react'

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
  const dispatch = useAppDispatch()
  const id = profileId.trim()
  const visible = useDocumentVisible()
  const hasPrefetched = Boolean(initialSettings)

  const { data: liveSettings } = useGetProfileSettingsQuery(
    { profileId: id, template },
    {
      skip: !id,
      refetchOnMountOrArgChange: hasPrefetched ? false : true,
      refetchOnFocus: !hasPrefetched,
      refetchOnReconnect: true,
      pollingInterval: id && visible ? PUBLIC_CARD_LIVE_POLL_MS : 0,
    }
  )

  useEffect(() => {
    if (!id) return
    return subscribePublicCardSettingsSaved((event) => {
      if (event.profileId && event.profileId !== id) return
      void dispatch(
        profileSettingsApi.endpoints.getProfileSettings.initiate(
          { profileId: id, template },
          { forceRefetch: true, subscribe: false }
        )
      )
    })
  }, [dispatch, id, template])

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
