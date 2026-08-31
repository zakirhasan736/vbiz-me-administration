'use client'

import { useAppSelector } from '@/hooks/redux'
import { useGoogleFont } from '@/hooks/useGoogleFont'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import type { MappedProfileSettings } from '@/lib/api/profileSettings/mapProfileSettings'
import { CardScopeProvider } from '@/lib/card-scope'
import { resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { collectPublicCardShareImageCandidates } from '@/lib/seo/resolvePublicCardSeo'
import { ProfileApp } from '@/profile-app/ProfileApp'
import { ProfileLoadingScreen } from '@/profile-app/components/ProfileLoadingScreen'
import { ProfileThemeShell } from '@/profile-app/components/ProfileThemeShell'
import { PublicCardPwaRuntime } from '@/profile-app/components/PublicCardPwaRuntime'
import { PublicPwaHead } from '@/profile-app/components/PublicPwaHead'
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
  const { record, isLoading, isError, error, actionButtons, myCard } = useProfile(slug, { initialMyCard })
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
      teamNotices: myCard?.team_notices ?? initialMyCard?.team_notices ?? null,
    }
  }, [record, designSettings, actionButtons, settingsAppearance, themeConfig, fromApi, myCard, initialMyCard])

  const resolvedLiveAgentCardData = useMemo<LiveAgentCardData | undefined>(() => {
    if (liveAgentCardData) {
      return { ...liveAgentCardData, profileId: liveAgentCardData.profileId || earlyProfileId }
    }
    if (!record || !profileProps || !profileProps.liveAgentEnabled) return undefined
    const personal = record.personal
    const handles = record.social?.handles ?? {}
    return {
      profileId: earlyProfileId,
      slug,
      ownerName: personal.fullName,
      title: personal.designation,
      profession: personal.profession || null,
      company: personal.company,
      email: personal.email,
      phone: personal.phone,
      whatsapp: personal.whatsapp,
      website: personal.website ?? '',
      location: personal.address,
      about: personal.about,
      socials: {
        facebook: handles.facebook || null,
        instagram: handles.instagram || null,
        twitter: handles.twitter || null,
        linkedin: handles.linkedin || null,
        youtube: handles.youtube || null,
        tiktok: handles.tiktok || null,
        rumble: handles.rumble || null,
        truth: handles.truth || null,
      },
      skills: (record.skills ?? []).map((group) => ({ category: group.type, skills: group.skills })),
      services: (record.services ?? []).map(({ title, description }) => ({ title, description })),
      experience: (record.experience ?? []).map((item) => ({
        title: item.jobTitle,
        job_title: item.jobTitle,
        company: item.company,
        description: item.description,
        from_date: item.fromDate,
        to_date: item.toDate || null,
        current_status: item.tillNow ? 1 : 0,
      })),
      education: (record.education ?? []).map((item) => ({
        title: item.degree,
        institute: item.institute,
        from_date: item.fromDate,
        to_date: item.toDate || null,
        current_status: item.tillNow ? 1 : 0,
      })),
      portfolio: (record.portfolio ?? []).map(({ title, description, url }) => ({
        title,
        description,
        url: url || null,
        status: 1,
      })),
      customSections: (record.customTabs ?? []).flatMap((tab) =>
        tab.items.map((item) => ({
          section: tab.label,
          title: item.title,
          summary: item.description,
          content: item.description,
          date: '',
        }))
      ),
      reviews: record.reviews ?? [],
      blogs: record.generalPosts ?? [],
      faqs: record.faqs ?? [],
      assistantContext: { businessBrief: '', knowledge: [] },
    }
  }, [liveAgentCardData, earlyProfileId, record, profileProps, slug])

  const shareImageUrl = useMemo(() => {
    const card = myCard ?? initialMyCard
    if (card) return collectPublicCardShareImageCandidates(card)[0] || record?.avatarImageUrl || ''
    return record?.avatarImageUrl || ''
  }, [myCard, initialMyCard, record?.avatarImageUrl])

  useGoogleFont(profileProps?.design?.fontFamily)

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

  const ownerName =
    resolvedLiveAgentCardData?.ownerName?.trim() ||
    record.personal?.fullName?.trim() ||
    profileProps.ownerName?.trim() ||
    slug

  return (
    <ProfileThemeShell config={themeConfig} fromApi={fromApi} template={template}>
      <PublicPwaHead slug={slug} ownerName={ownerName} seo={record.seo} imageUrl={shareImageUrl} />
      <PublicCardPwaRuntime
        slug={slug}
        profileId={earlyProfileId}
        template={template}
        initialNavBarLinks={initialNavBarLinks}
      />
      <ProfileThemeProvider themeConfig={themeConfig} fromApi={fromApi}>
        <CardScopeProvider cardId={record.id}>
          <ProfileApp
            {...profileProps}
            profileSlug={slug}
            initialNavBarLinks={initialNavBarLinks}
            liveAgentCardData={resolvedLiveAgentCardData}
            liveAgentSystemPrompt={liveAgentCardData ? liveAgentSystemPrompt : undefined}
          />
        </CardScopeProvider>
      </ProfileThemeProvider>
    </ProfileThemeShell>
  )
}
