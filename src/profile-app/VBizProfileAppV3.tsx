'use client'

import { resolveNotificationModalTarget } from '@/lib/push/notificationRouting'
import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { v3DesignToCssVars } from '@/lib/v3Theme'
import { LiveAgent } from '@/profile-app/components/LiveAgent'
import { ProfileBackgroundAudio } from '@/profile-app/components/ProfileBackgroundAudio'
import { ProfileFloatingNav } from '@/profile-app/components/ProfileFloatingNav'
import { ProfileHomeModals, type ProfileHomeModalId } from '@/profile-app/components/ProfileHomeModals'
import { ProfileSectionOutlet } from '@/profile-app/components/ProfileSectionOutlet'
import { useLiveAgentProfileActions } from '@/profile-app/hooks/useLiveAgentProfileActions'
import { useProfileHomeModalEvents } from '@/profile-app/hooks/useProfileHomeModalEvents'
import { useProfileMotionReady } from '@/profile-app/hooks/useProfileMotionReady'
import { useProfileTheme } from '@/profile-app/hooks/useProfileTheme'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import type { VBizProfileAppProps } from '@/profile-app/profilePublicProps'
import { DEMO_PROFILE_PROPS } from '@/profile-app/profilePublicProps'
import { ProfileThemeStyles } from '@/profile-app/ProfileThemeStyles'
import { useProfileIntroContext } from '@/profile-app/providers/ProfileIntroProvider'
import { useProfileNavigation } from '@/profile-app/providers/ProfileNavigationProvider'
import { useTranslationUi } from '@/profile-app/providers/TranslationProvider'
import { getV3AnimationProps, STATIC_ANIMATION_PROPS, type V3AnimationPreset } from '@/profile-app/v3/animationEngine'
import { Navigation } from '@/profile-app/v3/components/Navigation'
import { mapNavItemsToV3Tabs } from '@/profile-app/v3/navCategories'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type V3ModalState = ProfileHomeModalId

export function VBizProfileAppV3({
  cardOwnerId = DEMO_PROFILE_PROPS.cardOwnerId,
  ownerName = DEMO_PROFILE_PROPS.ownerName,
  liveAgentCardData = DEMO_PROFILE_PROPS.liveAgentCardData,
  liveAgentSystemPrompt,
  design: designProp,
  shareSlug,
  profileSlug,
  embedded = false,
  previewTheme,
  onPreviewThemeChange,
}: VBizProfileAppProps) {
  const { design: contextDesign } = useProfileDisplay()

  const design: ResolvedProfileDesign =
    designProp ??
    contextDesign ??
    resolveProfileDesign(
      {
        vcardPrimaryColor: '#eed677',
        vcardAccentColor: '#eed677',
        dashboardAccent: 'amber',
        fontFamily: 'inter',
        profileTemplate: 'v3',
        layoutStyle: 'classic',
        buttonStyle: 'solid',
        cornerStyle: 'round',
      },
      { darkMode: true }
    )

  const { visibleTabs, activeSectionId, goToSection } = useProfileNavigation()
  const navTabs = useMemo(() => mapNavItemsToV3Tabs(visibleTabs), [visibleTabs])

  const { theme, toggleTheme } = useProfileTheme({
    design,
    embedded,
    previewTheme,
    onPreviewThemeChange,
    defaultTheme: 'dark',
    bodyClassNames: {
      dark: 'bg-[#020914] text-zinc-100 transition-colors duration-500 ease-in-out font-sans',
      light: 'bg-white text-zinc-900 transition-colors duration-500 ease-in-out font-sans',
    },
  })
  const [activeModal, setActiveModal] = useState<V3ModalState>(null)
  const [isMobile, setIsMobile] = useState(false)
  const animationPreset: V3AnimationPreset = 'dynamic'
  const animationDuration = 0.65

  const { introAllowed } = useProfileIntroContext()
  const { openLanguageModal } = useTranslationUi()
  const cardSlug = profileSlug ?? shareSlug ?? 'preview'
  const motionReady = useProfileMotionReady()

  const openSaveContactModal = useCallback(() => setActiveModal('contact'), [])
  const openNotepadModal = useCallback(() => setActiveModal('notepad'), [])
  useLiveAgentProfileActions(openSaveContactModal, openNotepadModal)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleHeroAction = useCallback(
    (action: string) => {
      if (action === 'language') {
        openLanguageModal()
        return
      }
      if (action === 'notepad') {
        setActiveModal('notepad')
        return
      }
      if (action === 'settings') {
        void resolveNotificationModalTarget(cardSlug).then(setActiveModal)
        return
      }
      setActiveModal(action as V3ModalState)
    },
    [openLanguageModal, cardSlug]
  )

  useProfileHomeModalEvents(setActiveModal, { cardSlug })

  const rootStyle = v3DesignToCssVars(design)
  const homeHeroProps = {
    theme,
    onAction: handleHeroAction,
    toggleTheme,
  }

  return (
    <div
      data-profile-template="v3"
      data-embedded={embedded ? '' : undefined}
      data-theme={theme}
      className={`vbiz-profile-root vbiz-profile-v3 no-scrollbar relative flex min-h-dvh w-full flex-col items-center overflow-x-clip transition-colors duration-500 ${theme === 'dark' ? 'bg-ocean-deep text-zinc-100' : 'bg-white text-zinc-900'} ${embedded ? 'min-h-0 max-w-full' : ''}`}
      style={{
        ...rootStyle,
        backgroundColor: 'var(--vbiz-bg)',
        color: 'var(--vbiz-text)',
      }}
    >
      <ProfileThemeStyles design={design} />

      <ProfileFloatingNav theme={theme}>
        <Navigation
          tabs={navTabs}
          activeTab={activeSectionId}
          setActiveTab={goToSection}
          theme={theme}
          slugForPersistence={cardSlug}
        />
      </ProfileFloatingNav>

      <div className="relative z-20 mt-0 flex h-full w-full flex-1 flex-col px-0 md:mt-[72px]">
        <main
          className="no-scrollbar relative flex w-full flex-1 flex-col overflow-x-hidden md:overflow-x-visible"
          role="tabpanel"
          id={`panel-${activeSectionId}`}
          aria-labelledby={`tab-${activeSectionId}`}
          style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {(() => {
              const anim = motionReady
                ? getV3AnimationProps(activeSectionId, animationPreset, animationDuration, isMobile)
                : STATIC_ANIMATION_PROPS
              return (
                <motion.div
                  key={activeSectionId}
                  initial={anim.initial}
                  animate={anim.animate}
                  exit={anim.exit}
                  transition={anim.transition}
                  style={{
                    ...anim.style,
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  className="flex h-full w-full flex-1 flex-col"
                >
                  {activeSectionId === 'home' ? (
                    <ProfileSectionOutlet sectionId={activeSectionId} template="v3" homeHeroProps={homeHeroProps} />
                  ) : (
                    <div className="mx-auto mt-10 mb-10 min-h-auto w-full max-w-[1032px] px-6 md:mt-15">
                      <ProfileSectionOutlet sectionId={activeSectionId} template="v3" />
                    </div>
                  )}
                </motion.div>
              )
            })()}
          </AnimatePresence>
        </main>
      </div>

      <LiveAgent
        embedded={embedded}
        accentColor={design.accentColor}
        cardData={liveAgentCardData}
        systemInstruction={liveAgentSystemPrompt}
        readyToConnect={introAllowed}
      />

      {!embedded && (
        <ProfileHomeModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          onSetModal={setActiveModal}
          theme={theme}
          cardOwnerId={cardOwnerId}
          cardSlug={cardSlug}
          ownerName={liveAgentCardData?.ownerName ?? ownerName}
        />
      )}

      <ProfileBackgroundAudio profileSlug={profileSlug} shareSlug={shareSlug} />
    </div>
  )
}
