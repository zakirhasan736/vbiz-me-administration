'use client'

import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { designToCssVars, resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CursorTrail } from './components/CursorTrail'
import { DoneModal } from './components/DoneModal'
import { LiveAgent } from './components/LiveAgent'
import { NotificationAskModal } from './components/NotificationAskModal'
import { NotificationModal } from './components/NotificationModal'
import { NotificationSettingsModal } from './components/NotificationSettingsModal'
import { NotificationToast } from './components/NotificationToast'
import { ProfileSectionOutlet } from './components/ProfileSectionOutlet'
import { SaveContactModal } from './components/SaveContactModal'
import { SaveToWalletModal } from './components/SaveToWalletModal'
import { SiteGeometricGrid } from './components/SiteGeometricGrid'
import { useProfileNavScroll } from './hooks/useProfileNavScroll'
import { useProfileSection } from './hooks/useProfileSection'
import { useProfileDisplay } from './lib/profileDisplayContext'
import { PROFILE_NAV_MAX_WIDTH_CLASS } from './profileLayout'
import type { VBizProfileAppProps } from './profilePublicProps'
import { DEMO_PROFILE_PROPS } from './profilePublicProps'
import { ProfileThemeStyles } from './ProfileThemeStyles'
import { useProfileIntroContext } from './providers/ProfileIntroProvider'

type ModalState = 'none' | 'contact' | 'wallet' | 'notification' | 'settings' | 'done'

export function VBizProfileAppV1({
  explainerVideoUrl,
  cardOwnerId = DEMO_PROFILE_PROPS.cardOwnerId,
  ownerName = DEMO_PROFILE_PROPS.ownerName,
  liveAgentCardData = DEMO_PROFILE_PROPS.liveAgentCardData,
  design: designProp,
  shareSlug,
  sectionId,
  profileSlug,
  onSectionChange,
  embedded = false,
  previewTheme,
  onPreviewThemeChange,
  children: sectionSlot,
}: VBizProfileAppProps) {
  const { settings: displaySettings, pageColors } = useProfileDisplay()
  const slugForNav = profileSlug ?? shareSlug
  const {
    visibleTabs: visibleV1Tabs,
    activeSectionId,
    sectionHref,
    goToSection,
    useLinks,
  } = useProfileSection({
    sectionId,
    profileSlug: slugForNav,
    embedded,
    displaySettings,
    onSectionChange,
  })

  const design: ResolvedProfileDesign =
    designProp ??
    resolveProfileDesign(
      {
        vcardPrimaryColor: '#dcc969',
        vcardAccentColor: '#dcc969',
        dashboardAccent: 'amber',
        fontFamily: 'inter',
        profileTemplate: 'v1',
        layoutStyle: 'classic',
        buttonStyle: 'solid',
        cornerStyle: 'round',
      },
      { darkMode: true }
    )

  const [internalTheme, setInternalTheme] = useState<'light' | 'dark'>(() => {
    if (embedded) return design.darkMode ? 'dark' : 'light'
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  })
  const theme = embedded && previewTheme !== undefined ? previewTheme : internalTheme
  const [activeModal, setActiveModal] = useState<ModalState>('none')
  const { scrollRef: v1NavScrollRef, scrollClassName: v1NavScrollClassName } = useProfileNavScroll(
    slugForNav,
    'v1',
    activeSectionId
  )
  const { showPreloader, introAllowed, endPreloader, hasVideo } = useProfileIntroContext()

  useEffect(() => {
    const handleOpenModal = () => setActiveModal('contact')
    window.addEventListener('open-save-contact-flow', handleOpenModal)
    return () => window.removeEventListener('open-save-contact-flow', handleOpenModal)
  }, [])

  useEffect(() => {
    if (embedded) return
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme, embedded])

  useEffect(() => {
    console.log('🚀 vBiz Profile App Mounted (Version 1 - Classic)')
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (embedded && onPreviewThemeChange) {
      onPreviewThemeChange(next)
    } else {
      setInternalTheme(next)
    }
  }

  const accent = design.accentColor
  const rootStyle = {
    ...designToCssVars(design),
    ...(pageColors.pageBg ? { backgroundColor: pageColors.pageBg } : {}),
  }

  const renderV1NavTab = (tab: (typeof visibleV1Tabs)[number], isActive: boolean) => {
    const className = `relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 sm:h-11 lg:h-12 lg:w-12 ${
      isActive
        ? 'text-black'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white'
    }`
    const inner = (
      <>
        {isActive && (
          <div
            aria-hidden
            className="absolute inset-0 rounded-full shadow-[0_0_16px_rgba(234,179,8,0.45)] sm:shadow-[0_0_20px_rgba(234,179,8,0.5)]"
            style={{ backgroundColor: accent }}
          />
        )}
        <tab.icon
          size={isActive ? 22 : 20}
          className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : ''}`}
        />
      </>
    )

    if (useLinks) {
      return (
        <Link
          key={tab.id}
          href={sectionHref(tab.id)}
          scroll={false}
          draggable={false}
          className={className}
          title={tab.label}
          aria-label={tab.label}
          aria-current={isActive ? 'page' : undefined}
        >
          {inner}
        </Link>
      )
    }

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => goToSection(tab.id)}
        className={className}
        title={tab.label}
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {inner}
      </button>
    )
  }

  const shellClass = embedded
    ? 'vbiz-profile-root vbiz-profile-v1 relative isolate flex min-h-0 w-full max-w-full flex-col overflow-x-clip overflow-y-visible'
    : 'vbiz-profile-root vbiz-profile-v1 flex h-screen w-screen flex-col overflow-hidden'

  const v1NavClass = embedded
    ? 'vbiz-v1-nav pointer-events-none fixed inset-x-0 top-9 z-50 flex justify-center px-2 sm:top-10'
    : 'vbiz-v1-nav pointer-events-none fixed right-0 bottom-6 left-0 z-50 flex w-full justify-center px-4 lg:top-6 lg:bottom-auto'

  const v1NavInnerClass = embedded
    ? 'pointer-events-auto relative flex w-full min-w-0 max-w-[calc(100%-0.5rem)] items-center overflow-hidden rounded-full border border-black/5 bg-white p-1 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.15)] dark:border-white/15 dark:bg-black/80 dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.9)]'
    : `pointer-events-auto relative flex w-full min-w-0 overflow-hidden ${PROFILE_NAV_MAX_WIDTH_CLASS} items-center rounded-full border border-black/5 bg-white p-1.5 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.15)] md:p-2 dark:border-white/15 dark:bg-black/80 dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.9)]`

  const v1MainClass = embedded
    ? 'vbiz-v1-main relative z-10 flex w-full flex-1 flex-col bg-white pt-16 pb-4 transition-colors duration-700 dark:bg-[#050505]'
    : 'relative flex h-full w-full flex-1 flex-col overflow-y-auto bg-white pt-6 pb-28 transition-colors duration-700 lg:pt-28 lg:pb-6 dark:bg-[#050505]'

  const v1MainInnerClass = embedded
    ? 'vbiz-v1-main-inner relative z-10 flex h-full w-full max-w-full min-w-0 flex-1 flex-col px-0 py-0'
    : 'relative z-10 mx-auto flex h-full w-full max-w-[1500px] flex-1 flex-col px-4 py-2 sm:px-6 lg:px-8'

  return (
    <div
      data-embedded={embedded ? '' : undefined}
      data-profile-template="v1"
      className={`${shellClass} selection:bg-yellow-primary/30 font-sans transition-colors duration-700 selection:text-gray-900 dark:selection:text-white ${theme === 'dark' ? 'dark bg-[#050505] text-[#e0e0e0]' : 'bg-white text-gray-900'}`}
      style={rootStyle}
    >
      <ProfileThemeStyles design={design} />

      {showPreloader && hasVideo && (
        <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-black/95 px-4 text-center text-white">
          <video
            key={explainerVideoUrl}
            src={explainerVideoUrl?.trim() ?? ''}
            className="max-h-[72vh] w-full max-w-3xl rounded-2xl border border-white/10 bg-black shadow-2xl"
            autoPlay
            playsInline
            controls
            onEnded={endPreloader}
          />
          <button
            type="button"
            onClick={endPreloader}
            className="mt-6 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
          >
            Skip intro
          </button>
        </div>
      )}
      {showPreloader && !hasVideo && (
        <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-[#050505] text-zinc-100">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: accent, borderTopColor: 'transparent' }}
          />
          <p className="mt-4 text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Preparing</p>
        </div>
      )}

      <SiteGeometricGrid />
      <CursorTrail />

      {!embedded && (
        <motion.button
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="pointer-events-auto fixed top-1/2 right-4 z-60 flex h-20 w-12 -translate-y-1/2 flex-col items-center justify-between rounded-4xl border border-black/5 bg-white p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] sm:right-6 sm:h-24 sm:w-14 lg:p-3 dark:border-white/10 dark:bg-black/20 dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]"
        >
          <div
            className={`flex aspect-square w-full items-center justify-center rounded-full transition-all duration-500 ${theme === 'light' ? 'text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-black/5 text-white/30 dark:bg-white/5'}`}
            style={theme === 'light' ? { backgroundColor: accent } : undefined}
          >
            <Sun size={20} className="sm:h-6 sm:w-6" />
          </div>
          <div
            className={`flex aspect-square w-full items-center justify-center rounded-full transition-all duration-500 ${theme === 'dark' ? 'text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-50 text-gray-500 dark:text-white/20'}`}
            style={theme === 'dark' ? { backgroundColor: accent } : undefined}
          >
            <Moon size={20} className="sm:h-6 sm:w-6" />
          </div>
        </motion.button>
      )}

      {embedded ? (
        <header className={v1NavClass}>
          <div className={v1NavInnerClass}>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                ref={v1NavScrollRef}
                className={`vbiz-v1-nav-scroll mask-edges items-center gap-1.5 px-2 py-0.5 ${v1NavScrollClassName}`}
              >
                {visibleV1Tabs.map((tab) => renderV1NavTab(tab, activeSectionId === tab.id))}
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <main className={v1MainClass}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.05),transparent_50%)]" />
        <div className={v1MainInnerClass}>
          <div className="relative isolate w-full contain-[layout]">
            {sectionSlot ?? <ProfileSectionOutlet sectionId={activeSectionId} />}
          </div>
        </div>
      </main>

      {!embedded ? (
        <header className={v1NavClass}>
          <div className={v1NavInnerClass}>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                ref={v1NavScrollRef}
                className={`vbiz-v1-nav-scroll mask-edges items-center justify-start gap-2 px-3 py-1 sm:gap-2.5 ${v1NavScrollClassName}`}
              >
                {visibleV1Tabs.map((tab) => renderV1NavTab(tab, activeSectionId === tab.id))}
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <LiveAgent
        variant="v1"
        embedded={embedded}
        accentColor={design.accentColor}
        cardData={liveAgentCardData}
        readyToConnect={introAllowed}
      />

      {!embedded && (
        <>
          <NotificationModal
            cardOwnerId={cardOwnerId ?? '91'}
            ownerName={liveAgentCardData?.ownerName ?? ownerName ?? 'Guest'}
            enabled={introAllowed}
          />
          <NotificationToast />
          <SaveContactModal
            isOpen={activeModal === 'contact'}
            onClose={() => setActiveModal('none')}
            onSuccess={() => {
              const pref = localStorage.getItem(`vbizme_notif_${cardOwnerId}`)
              if (pref) {
                setActiveModal('done')
              } else {
                setActiveModal('wallet')
              }
            }}
          />
          <SaveToWalletModal
            isOpen={activeModal === 'wallet'}
            onClose={() => setActiveModal('none')}
            onAction={() => setActiveModal('notification')}
          />
          <NotificationAskModal
            isOpen={activeModal === 'notification'}
            onClose={() => {
              localStorage.setItem(`vbizme_notif_${cardOwnerId}`, JSON.stringify({ asked: true, accepted: false }))
              setActiveModal('none')
            }}
            cardOwnerId={cardOwnerId ?? '91'}
            onAccept={(sub, preferences) => {
              localStorage.setItem(
                `vbizme_notif_${cardOwnerId}`,
                JSON.stringify({ asked: true, accepted: true, subscription: sub, preferences })
              )
              setActiveModal('done')
            }}
          />
          <NotificationSettingsModal
            isOpen={activeModal === 'settings'}
            onClose={() => setActiveModal('none')}
            cardOwnerId={cardOwnerId ?? '91'}
          />
          <DoneModal isOpen={activeModal === 'done'} onClose={() => setActiveModal('none')} />
        </>
      )}
    </div>
  )
}
