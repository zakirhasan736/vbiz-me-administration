'use client'

import { resolveNotificationModalTarget } from '@/lib/push/notificationRouting'
import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { designToCssVars, resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { ProfileHomeModals, type ProfileHomeModalId } from '@/profile-app/components/ProfileHomeModals'
import { useProfileHomeModalEvents } from '@/profile-app/hooks/useProfileHomeModalEvents'
import { useProfileTheme } from '@/profile-app/hooks/useProfileTheme'
import { ArrowDown, Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { LiveAgent } from './components/LiveAgent'
import { ProfileBackgroundAudio } from './components/ProfileBackgroundAudio'
import { ProfileCoverMedia } from './components/ProfileCoverMedia'
import { ProfileLanguageButton } from './components/ProfileLanguageButton'
import { ProfileSectionOutlet } from './components/ProfileSectionOutlet'
import { useLiveAgentProfileActions } from './hooks/useLiveAgentProfileActions'
import { useProfileSectionScroll } from './hooks/useProfileSectionScroll'
import { useProfileDisplay } from './lib/profileDisplayContext'
import { shareProfile } from './lib/shareProfile'
import type { VBizProfileAppProps } from './profilePublicProps'
import { DEMO_PROFILE_PROPS } from './profilePublicProps'
import { ProfileThemeStyles } from './ProfileThemeStyles'
import { useProfileIntroContext } from './providers/ProfileIntroProvider'
import { useProfileNavigation } from './providers/ProfileNavigationProvider'
import { useTranslationUi } from './providers/TranslationProvider'
import { ProfileHeaderV2 } from './v2/components/ProfileHeaderV2'
import { ProfileNavigationV2 } from './v2/components/ProfileNavigationV2'

export type { VBizProfileAppProps } from './profilePublicProps'

type V2ModalState = ProfileHomeModalId

export function VBizProfileApp({
  explainerVideoUrl,
  cardOwnerId = DEMO_PROFILE_PROPS.cardOwnerId,
  ownerName = DEMO_PROFILE_PROPS.ownerName,
  tagline = DEMO_PROFILE_PROPS.tagline,
  coverVideoUrl = DEMO_PROFILE_PROPS.coverVideoUrl,
  avatarVideoUrl,
  liveAgentCardData = DEMO_PROFILE_PROPS.liveAgentCardData,
  liveAgentSystemPrompt,
  design: designProp,
  shareSlug,
  profileSlug,
  embedded = false,
  previewTheme,
  onPreviewThemeChange,
}: VBizProfileAppProps) {
  const { isVisible, pageColors, field } = useProfileDisplay()
  const slugForPersistence = profileSlug ?? shareSlug
  const cardSlug = slugForPersistence ?? 'preview'
  const { activeSectionId } = useProfileNavigation()
  const { openLanguageModal } = useTranslationUi()
  const { isScrolled } = useProfileSectionScroll(activeSectionId)

  const headerTextColor = field('vCard Header Color').textColor || field('MyInfo section Name').textColor || undefined
  const design: ResolvedProfileDesign =
    designProp ??
    resolveProfileDesign(
      {
        vcardPrimaryColor: '#eab308',
        vcardAccentColor: '#eab308',
        dashboardAccent: 'amber',
        fontFamily: 'inter',
        profileTemplate: 'v2',
        layoutStyle: 'classic',
        buttonStyle: 'solid',
        cornerStyle: 'round',
      },
      { darkMode: true }
    )

  const { theme, toggleTheme } = useProfileTheme({
    design,
    embedded,
    previewTheme,
    onPreviewThemeChange,
    defaultTheme: 'dark',
    bodyClassNames: {
      dark: 'bg-[#09090b] text-zinc-200 transition-colors duration-500 ease-in-out',
      light: 'bg-zinc-50 text-zinc-900 transition-colors duration-500 ease-in-out',
    },
  })
  const [activeModal, setActiveModal] = useState<V2ModalState>(null)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const { showPreloader, introAllowed, hasVideo } = useProfileIntroContext()
  const coverPersistenceId = slugForPersistence?.trim() || 'profile'

  const openSaveContactModal = useCallback(() => setActiveModal('contact'), [])
  const openNotepadModal = useCallback(() => setActiveModal('notepad'), [])
  useLiveAgentProfileActions(openSaveContactModal, openNotepadModal)

  const handleShare = useCallback(async () => {
    const result = await shareProfile({
      shareSlug,
      title: ownerName ?? 'Profile',
      text: `Check out ${ownerName ?? 'this'}'s digital business card`,
    })

    if (result === 'copied') {
      setShareFeedback('Link copied to clipboard')
      window.setTimeout(() => setShareFeedback(null), 2500)
    } else if (result === 'failed') {
      setShareFeedback('Unable to share — try copying the URL from your browser')
      window.setTimeout(() => setShareFeedback(null), 3000)
    }
  }, [shareSlug, ownerName])

  useProfileHomeModalEvents(setActiveModal, { cardSlug })

  const rootStyle = {
    ...designToCssVars(design),
    ...(pageColors.pageBg ? { backgroundColor: pageColors.pageBg } : {}),
  }

  return (
    <div
      data-profile-template="v2"
      data-embedded={embedded ? '' : undefined}
      data-theme={theme}
      className={`vbiz-profile-root w-full font-sans ${embedded ? 'relative isolate flex h-full min-h-0 max-w-full flex-col overflow-x-clip pb-0' : 'flex min-h-screen w-screen justify-center overflow-x-clip pb-24'} ${theme === 'dark' ? 'dark bg-[#09090b] text-zinc-200' : 'bg-zinc-50 text-zinc-900'} relative transition-colors duration-500 ease-in-out selection:bg-yellow-500/30 selection:text-white`}
      style={rootStyle}
    >
      <ProfileThemeStyles design={design} />
      {showPreloader && !hasVideo && (
        <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 dark:bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
          <p className="mt-4 text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Preparing</p>
        </div>
      )}
      {!embedded && (
        <div className="absolute top-4 right-4 z-100 flex items-center gap-2 sm:fixed">
          <ProfileLanguageButton className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700" />
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-zinc-700/50 bg-zinc-800 p-1.5 text-yellow-400 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-md transition-colors md:h-10 md:w-10 md:p-2.5 dark:border-zinc-200 dark:bg-white dark:text-zinc-800"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -15, opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                exit={{ y: 15, opacity: 0, scale: 0.5, rotate: 45 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {theme === 'dark' ? (
                  <Sun size={16} className="stroke-[2.5] text-yellow-400 md:h-5 md:w-5" />
                ) : (
                  <Moon size={16} className="stroke-[2.5] text-zinc-100 md:h-5 md:w-5 dark:text-zinc-800" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 70, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-10%] aspect-square w-[70vw] rounded-full bg-[#eab308]/5 blur-[140px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 80, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[-10%] bottom-[-20%] aspect-square w-[60vw] rounded-full bg-zinc-800/10 blur-[140px]"
        />
      </div>

      <ProfileCoverMedia
        persistenceId={coverPersistenceId}
        coverVideoUrl={coverVideoUrl}
        ownerName={ownerName}
        isHeroLayout={false}
      />

      <div
        className={`vbiz-profile-main relative z-20 mx-auto flex w-full max-w-[1032px] flex-col ${embedded ? 'min-h-0 max-w-full px-3.5 pt-24' : 'min-h-screen px-5 pt-16 sm:px-8 sm:pt-44'}`}
      >
        <ProfileHeaderV2
          avatarVideoUrl={avatarVideoUrl}
          explainerVideoUrl={explainerVideoUrl ?? undefined}
          ownerName={ownerName}
          tagline={tagline}
          headerTextColor={headerTextColor ?? undefined}
          embedded={embedded}
          onShare={() => (isVisible('Share Btn') ? setActiveModal('share') : void handleShare())}
          onNotificationSettings={() => {
            void resolveNotificationModalTarget(cardSlug).then(setActiveModal)
          }}
          onOpenNotepad={() => setActiveModal('notepad')}
          onLanguage={openLanguageModal}
        />

        <ProfileNavigationV2 slugForPersistence={slugForPersistence} embedded={embedded} />

        <main
          id="content-pane"
          className="relative isolate w-full contain-[layout]"
          role="tabpanel"
          aria-labelledby={`tab-${activeSectionId}`}
        >
          {activeSectionId === 'home' ? (
            <ProfileSectionOutlet sectionId={activeSectionId} template="v2" />
          ) : (
            <div className="mx-auto w-full max-w-[1032px] lg:px-6">
              <ProfileSectionOutlet sectionId={activeSectionId} template="v2" />
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {!isScrolled && !embedded && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pointer-events-none fixed top-[60%] left-0 z-40 -translate-y-1/2 md:hidden"
          >
            <div className="flex flex-col items-center gap-2 rounded-r-xl border-y border-r border-[#eab308] bg-linear-to-b from-[#fef08a] to-[#eab308] px-1 py-3 text-zinc-950 shadow-[4px_0_16px_rgba(234,179,8,0.3)]">
              <span
                className="text-[8px] font-black tracking-[0.2em] uppercase"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                Scroll For More
              </span>
              <div className="mt-1 flex h-4 w-4 animate-bounce items-center justify-center rounded-full bg-zinc-950 text-[#eab308]">
                <ArrowDown size={10} strokeWidth={3} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 left-1/2 z-250 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
          >
            {shareFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      <LiveAgent
        embedded={embedded}
        accentColor={design.accentColor}
        cardData={liveAgentCardData}
        systemInstruction={liveAgentSystemPrompt}
        readyToConnect={introAllowed}
        wrapperClassName="right-3 top-1/2 -translate-y-1/2 md:right-6 md:top-auto md:bottom-[60px] md:translate-y-0 lg:right-10 lg:bottom-[60px]"
      />

      {!embedded && (
        <ProfileHomeModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          onSetModal={setActiveModal}
          theme={theme}
          cardOwnerId={cardOwnerId}
          cardSlug={profileSlug ?? shareSlug ?? 'preview'}
          ownerName={ownerName}
        />
      )}

      <ProfileBackgroundAudio profileSlug={profileSlug} shareSlug={shareSlug} />
    </div>
  )
}
