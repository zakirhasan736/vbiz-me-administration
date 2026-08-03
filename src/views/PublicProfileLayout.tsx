'use client'

import { useAppSelector } from '@/hooks/redux'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import type { MappedProfileSettings } from '@/lib/api/profileSettings/mapProfileSettings'
import { CardScopeProvider } from '@/lib/card-scope'
import { resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { ProfileApp } from '@/profile-app/ProfileApp'
import { ProfileLoadingScreen } from '@/profile-app/components/ProfileLoadingScreen'
import { ProfileThemeShell } from '@/profile-app/components/ProfileThemeShell'
import { useResolvedProfileTheme } from '@/profile-app/hooks/useResolvedProfileTheme'
import '@/profile-app/profile-app.css'
import { vCardRecordToProfileProps } from '@/profile-app/profilePublicProps'
import { ProfileThemeProvider } from '@/profile-app/providers/ProfileThemeProvider'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import { useProfile } from '@/redux/features/myCard'
import type { MyCardData } from '@interfaces/api/myCard'
import { useMemo } from 'react'

import type { LiveAgentCardData } from '@/profile-app/lib/liveAgentPrompt'

type Props = {
  slug: string
  /** Server-prefetched profile — skips client loading screen on first visit. */
  initialMyCard?: MyCardData | null
  /** Server-prefetched navbar catalog. */
  initialNavBarLinks?: NavBarLinksData | null
  /** Server-prefetched `GET /profiles/{id}/settings` (theme + appearance). */
  initialProfileSettings?: MappedProfileSettings | null
  liveAgentCardData?: LiveAgentCardData
  liveAgentSystemPrompt?: string
}

/** Stable per-slug layout. Cover video is detached in `ProfileApp` (`ProfileCoverHost`). */
export default function PublicProfileLayout({
  slug,
  initialMyCard,
  initialNavBarLinks,
  initialProfileSettings,
  liveAgentCardData,
  liveAgentSystemPrompt,
}: Props) {
  const { record, isLoading, isError, error, actionButtons } = useProfile(slug, { initialMyCard })
  const designSettings = useAppSelector((s) => s.designSettings)

  const earlyTemplate: ProfileTemplateId =
    (record?.appearance?.profileTemplate as ProfileTemplateId | undefined) ?? 'v3'

  const earlyProfileId =
    record?.id != null ? String(record.id) : initialMyCard?.profile?.id != null ? String(initialMyCard.profile.id) : ''

  const {
    themeConfig,
    appearance: settingsAppearance,
    fromApi,
  } = useResolvedProfileTheme({
    profileId: earlyProfileId,
    template: earlyTemplate,
    initialSettings: initialProfileSettings,
    cardThemeConfig: record?.themeConfig ?? null,
  })

  const template: ProfileTemplateId = earlyTemplate

  const profileProps = useMemo(() => {
    if (!record) return null
    const base = vCardRecordToProfileProps(record, designSettings, actionButtons)
    const appearance = {
      ...record.appearance,
      ...settingsAppearance,
    }
    const design = resolveProfileDesign(designSettings, record.theme, appearance, {
      themeConfig,
    })

    return {
      ...base,
      design,
      themeConfig,
      themeFromApi: fromApi,
    }
  }, [record, designSettings, actionButtons, settingsAppearance, themeConfig, fromApi])

  if (isLoading) {
    return (
      <ProfileThemeShell config={themeConfig} fromApi={fromApi} template={template}>
        <ProfileLoadingScreen />
      </ProfileThemeShell>
    )
  }

  if (isError || !record || !profileProps) {
    const message =
      error && typeof error === 'object' && 'data' in error && typeof error.data === 'string'
        ? error.data
        : 'Profile not found'

    return (
      <ProfileThemeShell config={themeConfig} fromApi={fromApi} template={template}>
        <div className="vbiz-loading-screen flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="vbiz-title text-lg font-bold">vCard not found</p>
          <p className="vbiz-description mt-2 max-w-md text-sm">
            {message}. No public card matches <span className="vbiz-title font-mono">{slug}</span>.
          </p>
        </div>
      </ProfileThemeShell>
    )
  }

  return (
    <ProfileThemeShell config={themeConfig} fromApi={fromApi} template={template}>
      <ProfileThemeProvider themeConfig={themeConfig} fromApi={fromApi}>
        <CardScopeProvider cardId={record.id}>
          <ProfileApp
            {...profileProps}
            profileSlug={slug}
            initialNavBarLinks={initialNavBarLinks}
            liveAgentCardData={liveAgentCardData}
            liveAgentSystemPrompt={liveAgentSystemPrompt}
          />
        </CardScopeProvider>
      </ProfileThemeProvider>
    </ProfileThemeShell>
  )
}
