'use client'

import { CardNoticeAfterIntro } from '@/profile-app/components/CardNoticeAfterIntro'
import { CardPushMediaSync } from '@/profile-app/components/CardPushMediaSync'
import { CinematicScrollbarBinder } from '@/profile-app/components/CinematicScrollbarBinder'
import { EmbeddedDraftCacheSync } from '@/profile-app/components/EmbeddedDraftCacheSync'
import { ProfileBrandPreloader } from '@/profile-app/components/ProfileBrandPreloader'
import { ProfileForceNotification } from '@/profile-app/components/ProfileForceNotification'
import { ProfileIntroOverlay } from '@/profile-app/components/ProfileIntroOverlay'
import { ProfileViewTracker } from '@/profile-app/components/ProfileViewTracker'
import { ProfileDisplayProvider } from '@/profile-app/lib/profileDisplayContext'
import type { VBizProfileAppProps } from '@/profile-app/profilePublicProps'
import { ProfileIntroProvider } from '@/profile-app/providers/ProfileIntroProvider'
import { ProfileNavigationProvider } from '@/profile-app/providers/ProfileNavigationProvider'
import { TranslationProvider } from '@/profile-app/providers/TranslationProvider'
import dynamic from 'next/dynamic'

/** Lazy-load only the active template shell to reduce initial JS. */
const VBizProfileApp = dynamic(() =>
  import('@/profile-app/VBizProfileApp').then((m) => ({ default: m.VBizProfileApp }))
)
const VBizProfileAppV1 = dynamic(() =>
  import('@/profile-app/VBizProfileAppV1').then((m) => ({ default: m.VBizProfileAppV1 }))
)
const VBizProfileAppV3 = dynamic(() =>
  import('@/profile-app/VBizProfileAppV3').then((m) => ({ default: m.VBizProfileAppV3 }))
)

/** Renders v1, v2, or v3 profile shell from resolved design settings. */
export function ProfileApp(props: VBizProfileAppProps) {
  const template = props.design?.profileTemplate ?? 'v3'

  const shell =
    template === 'v1' ? (
      <VBizProfileAppV1 {...props} />
    ) : template === 'v2' ? (
      <VBizProfileApp {...props} />
    ) : (
      <VBizProfileAppV3 {...props} />
    )

  return (
    <ProfileDisplayProvider
      personal={props.personal}
      displaySettings={props.displaySettings}
      social={props.social}
      extraFields={props.extraFields}
      education={props.education}
      experience={props.experience}
      services={props.services}
      generalPosts={props.generalPosts}
      faqs={props.faqs}
      customTabs={props.customTabs}
      tabLabelOverrides={props.tabLabelOverrides}
      design={props.design ?? null}
      avatarMediaUrl={props.avatarVideoUrl}
      embedded={props.embedded}
      previewActive={props.previewActive}
      cardOwnerId={props.cardOwnerId}
      cardSlug={props.profileSlug ?? props.shareSlug}
      profileViews={props.profileViews}
      actionButtons={props.actionButtons}
    >
      <EmbeddedDraftCacheSync
        embedded={props.embedded}
        cardOwnerId={props.cardOwnerId}
        sectionPosts={props.sectionPosts}
        customTabs={props.customTabs}
        generalPosts={props.generalPosts}
        faqs={props.faqs}
        education={props.education}
        experience={props.experience}
        skills={props.skills}
        services={props.services}
        portfolio={props.portfolio}
        reviews={props.reviews}
      />
      <TranslationProvider
        cardOwnerId={props.cardOwnerId}
        profileSlug={props.profileSlug ?? props.shareSlug}
        theme={props.design?.profileTemplate === 'v1' ? (props.design.darkMode ? 'dark' : 'light') : undefined}
      >
        <ProfileNavigationProvider
          sectionId={props.sectionId}
          onSectionChange={props.onSectionChange}
          initialNavBarLinks={props.initialNavBarLinks}
        >
          <ProfileIntroProvider
            embedded={props.embedded}
            profileSlug={props.profileSlug}
            shareSlug={props.shareSlug}
            explainerVideoUrl={props.explainerVideoUrl}
          >
            <ProfileForceNotification
              cardOwnerId={props.cardOwnerId}
              cardSlug={props.profileSlug ?? props.shareSlug ?? 'preview'}
              ownerName={props.liveAgentCardData?.ownerName ?? props.ownerName ?? 'Guest'}
              embedded={props.embedded}
            />
            <ProfileViewTracker
              profileId={props.cardOwnerId}
              slug={props.profileSlug ?? props.shareSlug}
              embedded={props.embedded}
            />
            {!props.embedded && <CardPushMediaSync />}
            {!props.embedded && <ProfileBrandPreloader />}
            {!props.embedded && <ProfileIntroOverlay explainerVideoUrl={props.explainerVideoUrl} />}
            <CardNoticeAfterIntro
              embedded={props.embedded}
              profileSlug={props.profileSlug ?? props.shareSlug}
              ownerName={props.ownerName}
              teamNotices={props.teamNotices}
            />
            <CinematicScrollbarBinder />
            {shell}
          </ProfileIntroProvider>
        </ProfileNavigationProvider>
      </TranslationProvider>
    </ProfileDisplayProvider>
  )
}

export type { VBizProfileAppProps } from '@/profile-app/profilePublicProps'
