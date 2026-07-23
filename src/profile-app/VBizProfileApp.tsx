'use client'

import { isVideoUrl } from '@/lib/mediaUrl'
import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import {
  buttonStyleClasses,
  cornerStyleToRadius,
  designToCssVars,
  resolveProfileDesign,
} from '@/lib/resolvedProfileDesign'
import { cn } from '@/utils/cn'
import { Bell, CheckCircle2, Download, Moon, Share2, Star, StickyNote, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CursorTrail } from './components/CursorTrail'
import { DoneModal } from './components/DoneModal'
import { LeaveMessageModal } from './components/LeaveMessageModal'
import { LiveAgent } from './components/LiveAgent'
import { NotificationAskModal } from './components/NotificationAskModal'
import { NotificationModal } from './components/NotificationModal'
import { NotificationSettingsModal } from './components/NotificationSettingsModal'
import { NotificationToast } from './components/NotificationToast'
import { ProfileCoverMedia } from './components/ProfileCoverMedia'
import { ProfileSectionOutlet } from './components/ProfileSectionOutlet'
import { SaveContactModal } from './components/SaveContactModal'
import { SaveToWalletModal } from './components/SaveToWalletModal'
import { useProfileNavScroll } from './hooks/useProfileNavScroll'
import { useProfileSection } from './hooks/useProfileSection'
import { useProfileDisplay } from './lib/profileDisplayContext'
import { shareProfile } from './lib/shareProfile'
import { PROFILE_NAV_MAX_WIDTH_CLASS } from './profileLayout'
import type { VBizProfileAppProps } from './profilePublicProps'
import { DEMO_PROFILE_PROPS, resolveProfileAvatarSrc } from './profilePublicProps'
import { ProfileThemeStyles } from './ProfileThemeStyles'
import { useProfileIntroContext } from './providers/ProfileIntroProvider'

export type { VBizProfileAppProps } from './profilePublicProps'

export function VBizProfileApp({
  explainerVideoUrl,
  cardOwnerId = DEMO_PROFILE_PROPS.cardOwnerId,
  ownerName = DEMO_PROFILE_PROPS.ownerName,
  tagline = DEMO_PROFILE_PROPS.tagline,
  coverVideoUrl = DEMO_PROFILE_PROPS.coverVideoUrl,
  avatarVideoUrl,
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
  const { isVisible, pageColors, field, settings: displaySettings } = useProfileDisplay()
  const slugForNav = profileSlug ?? shareSlug
  const { visibleTabs, activeSectionId, sectionHref, goToSection, useLinks } = useProfileSection({
    sectionId,
    profileSlug: slugForNav,
    embedded,
    displaySettings,
    onSectionChange,
  })
  const showSaveContact = isVisible('Save Contact')
  const showShareBtn = isVisible('Share Btn')
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

  const [internalTheme, setInternalTheme] = useState<'light' | 'dark'>(() => {
    if (embedded) return design.darkMode ? 'dark' : 'light'
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  })
  const theme = embedded && previewTheme !== undefined ? previewTheme : internalTheme
  const [activeModal, setActiveModal] = useState<'contact' | 'wallet' | 'notification' | 'done' | 'settings' | null>(
    null
  )
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const { scrollRef: navScrollRef, scrollClassName: navScrollClassName } = useProfileNavScroll(
    slugForNav,
    'v2',
    activeSectionId
  )
  const avatarVideoRef = useRef<HTMLVideoElement>(null)
  const { showPreloader, introAllowed, endPreloader, hasVideo } = useProfileIntroContext()
  const coverPersistenceId = slugForNav?.trim() || shareSlug?.trim() || 'profile'

  const avatarDisplaySrc = useMemo(
    () => resolveProfileAvatarSrc(avatarVideoUrl, explainerVideoUrl),
    [avatarVideoUrl, explainerVideoUrl]
  )
  const avatarIsVideo = Boolean(avatarDisplaySrc && isVideoUrl(avatarDisplaySrc))

  useEffect(() => {
    if (!introAllowed || !avatarIsVideo) return
    const el = avatarVideoRef.current
    if (!el) return
    void (async () => {
      try {
        el.muted = true
        if (el.paused) await el.play()
      } catch {
        /* autoplay blocked */
      }
    })()
  }, [introAllowed, avatarIsVideo, avatarDisplaySrc])

  useEffect(() => {
    if (embedded) return
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme, embedded])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (embedded && onPreviewThemeChange) {
      onPreviewThemeChange(next)
    } else {
      setInternalTheme(next)
    }
  }

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

  useEffect(() => {
    console.log('🚀 vBiz Profile App Mounted (Version 2 - Link in Bio)')
  }, [])

  const isHeroLayout = design.layoutStyle === 'hero'
  const cornerRadius = cornerStyleToRadius(design.cornerStyle)
  const ctaButtonClass = buttonStyleClasses(design.buttonStyle)
  const rootStyle = {
    ...designToCssVars(design),
    ...(pageColors.pageBg ? { backgroundColor: pageColors.pageBg } : {}),
  }

  return (
    <div
      data-embedded={embedded ? '' : undefined}
      className={`vbiz-profile-root w-full ${embedded ? 'relative isolate flex h-full min-h-0 max-w-full flex-col overflow-x-clip pb-0' : 'flex min-h-screen w-screen justify-center overflow-x-clip pb-24'} ${theme === 'dark' ? 'dark bg-[#09090b] text-zinc-200' : 'bg-zinc-50 text-zinc-900'} relative transition-colors duration-300 selection:bg-yellow-500/30 selection:text-white`}
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
        <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 dark:bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
          <p className="mt-4 text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Preparing</p>
        </div>
      )}
      <CursorTrail />

      {!embedded && (
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="fixed top-4 right-4 z-100 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 p-2 text-zinc-200 transition-colors dark:bg-zinc-200 dark:text-zinc-800"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      {/* Abstract Animated Soft Background Waves */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 70, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-10%] aspect-square w-[70vw] rounded-full blur-[140px]"
          style={{ backgroundColor: `${design.accentColor}14` }}
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 80, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[-10%] bottom-[-20%] aspect-square w-[60vw] rounded-full bg-zinc-800/10 blur-[140px]"
        />
      </div>

      <ProfileCoverMedia
        persistenceId={coverPersistenceId}
        coverVideoUrl={coverVideoUrl}
        ownerName={ownerName}
        isHeroLayout={isHeroLayout}
      />

      {/* Main Container */}
      <div
        className={`vbiz-profile-main relative z-20 mx-auto flex w-full max-w-[1032px] flex-col ${embedded ? 'min-h-0 max-w-full px-3.5 pt-24' : 'min-h-screen px-5 sm:px-8'} ${!embedded && (isHeroLayout ? 'pt-48 sm:pt-56' : 'pt-32 sm:pt-44')}`}
      >
        {/* Profile Header */}
        <header
          className={`relative flex w-full flex-col ${embedded ? 'mt-1 mb-8' : 'mb-10'} ${embedded || !isHeroLayout ? 'items-center text-center' : 'max-w-xl items-start text-left md:mx-auto md:items-center md:text-center'}`}
        >
          <div className={`group relative mb-6 ${!embedded && isHeroLayout ? 'self-start md:self-center' : ''}`}>
            <div
              className={`vbiz-profile-avatar relative z-10 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 transition-transform duration-500 group-hover:scale-[1.02] ${embedded ? 'h-24 w-24' : 'h-28 w-28 sm:h-36 sm:w-36'}`}
            >
              {avatarIsVideo ? (
                <video
                  ref={avatarVideoRef}
                  src={avatarDisplaySrc}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full scale-105 object-cover"
                />
              ) : avatarDisplaySrc ? (
                <Image
                  width={1000}
                  height={1000}
                  src={avatarDisplaySrc}
                  alt={ownerName ? `${ownerName} avatar` : 'Avatar'}
                  className="h-full w-full scale-105 object-cover"
                />
              ) : null}
            </div>
            {/* Soft shadow underlying the avatar */}
            <div className="absolute right-1 bottom-1 z-20 rounded-full bg-green-500 p-1.5 text-zinc-950 shadow-sm ring-4 ring-zinc-50 dark:ring-[#09090b]">
              <CheckCircle2 size={16} fill="white" className="text-green-500" />
            </div>
          </div>

          <div className="vbiz-header-badges mb-4 flex items-center gap-2">
            <span className="rounded-full border border-zinc-300/50 bg-zinc-200/50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-700 sm:text-xs dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:text-zinc-300">
              A.I. Enabled
            </span>
            <span className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-700 sm:text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Star size={10} fill="currentColor" className="text-zinc-400" /> Verified
            </span>
          </div>

          {ownerName ? (
            <h1
              className={`vbiz-header-title mb-3 font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ${embedded ? 'px-1 text-2xl' : 'text-3xl sm:text-4xl'}`}
              style={headerTextColor ? { color: headerTextColor } : undefined}
            >
              {ownerName}
            </h1>
          ) : null}
          {tagline ? (
            <p
              className={`vbiz-header-tagline mb-8 max-w-md font-medium text-zinc-600 dark:text-zinc-400 ${embedded ? 'px-1 text-sm' : 'text-sm sm:text-base'}`}
              style={headerTextColor ? { color: headerTextColor } : undefined}
            >
              {tagline}
            </p>
          ) : null}

          <div
            className={`vbiz-header-cta flex w-full max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3 ${embedded ? '' : isHeroLayout ? 'md:justify-start' : ''}`}
          >
            {showSaveContact && (
              <button
                type="button"
                onClick={() => setActiveModal('contact')}
                className={`vbiz-cta-primary flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${ctaButtonClass}`}
                style={{
                  borderRadius: cornerRadius,
                  ...(design.buttonStyle === 'solid' || design.buttonStyle === 'soft'
                    ? {
                        backgroundColor:
                          design.buttonStyle === 'soft' ? `${design.primaryColor}22` : design.primaryColor,
                        color: design.buttonStyle === 'soft' ? design.primaryColor : '#fff',
                      }
                    : design.buttonStyle === 'outline'
                      ? { color: design.primaryColor, borderColor: design.primaryColor }
                      : {}),
                }}
              >
                <Download size={16} className="shrink-0" />
                <span>Save Contact</span>
              </button>
            )}
            <div className="vbiz-cta-icon-row flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMessageModalOpen(true)}
                className="vbiz-cta-icon flex h-12 w-12 shrink-0 items-center justify-center border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                style={{ borderRadius: cornerRadius }}
                aria-label="Leave a message"
                title="Leave a message"
              >
                <StickyNote size={18} />
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('settings')}
                className="vbiz-cta-icon flex h-12 w-12 shrink-0 items-center justify-center border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                style={{ borderRadius: cornerRadius }}
                aria-label="Notification settings"
              >
                <Bell size={18} />
              </button>
              {showShareBtn && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="vbiz-cta-icon flex h-12 w-12 shrink-0 items-center justify-center border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  style={{ borderRadius: cornerRadius }}
                  aria-label="Share profile"
                >
                  <Share2 size={18} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Floating Top Nav (Scrollable Pills) */}
        <div
          className={cn(
            'vbiz-floating-nav sticky top-4 z-50 mx-auto mb-8 flex w-full justify-center sm:top-6',
            embedded ? 'max-w-full' : PROFILE_NAV_MAX_WIDTH_CLASS
          )}
        >
          <div
            className={`vbiz-floating-nav-inner relative flex w-full max-w-full min-w-0 rounded-4xl border border-zinc-200/80 bg-white/80 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-3xl sm:rounded-full dark:border-zinc-700/50 dark:bg-zinc-900/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] ${embedded ? 'max-w-[calc(100%-0.5rem)]' : ''}`}
          >
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                ref={navScrollRef}
                role="tablist"
                aria-label="Profile navigation"
                aria-orientation="horizontal"
                className={cn(
                  'vbiz-floating-nav-scroll mask-edges items-center gap-1.5 px-1 sm:gap-2 sm:px-2',
                  navScrollClassName
                )}
              >
                {visibleTabs.map((tab, index) => {
                  const isActive = activeSectionId === tab.id
                  const tabClassName = `vbiz-nav-tab relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:h-14 sm:w-14 ${
                    isActive
                      ? 'z-10 shadow-[0_4px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_15px_rgba(255,255,255,0.1)]'
                      : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
                  }`
                  const tabInner = (
                    <>
                      {isActive && (
                        <div aria-hidden className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-white" />
                      )}
                      <div className="relative z-10 flex items-center justify-center">
                        <tab.icon
                          strokeWidth={isActive ? 2.5 : 2}
                          className={`vbiz-nav-tab-icon h-[18px] w-[18px] transition-colors duration-300 sm:h-[22px] sm:w-[22px] ${isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-500'}`}
                        />
                      </div>
                    </>
                  )
                  const onKeyDown = (e: KeyboardEvent) => {
                    let nextIndex = index
                    if (e.key === 'ArrowRight') {
                      nextIndex = (index + 1) % visibleTabs.length
                    } else if (e.key === 'ArrowLeft') {
                      nextIndex = (index - 1 + visibleTabs.length) % visibleTabs.length
                    } else if (e.key === 'Home') {
                      nextIndex = 0
                    } else if (e.key === 'End') {
                      nextIndex = visibleTabs.length - 1
                    }
                    if (nextIndex !== index) {
                      e.preventDefault()
                      const nextId = visibleTabs[nextIndex].id
                      goToSection(nextId)
                      document.getElementById(`tab-${nextId}`)?.focus({ preventScroll: true })
                    }
                  }

                  if (useLinks) {
                    return (
                      <Link
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        href={sectionHref(tab.id)}
                        scroll={false}
                        draggable={false}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${tab.id}`}
                        tabIndex={isActive ? 0 : -1}
                        title={tab.label}
                        aria-label={tab.label}
                        className={tabClassName}
                        onKeyDown={onKeyDown}
                      >
                        {tabInner}
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.id}`}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => goToSection(tab.id)}
                      onKeyDown={onKeyDown}
                      title={tab.label}
                      aria-label={tab.label}
                      className={tabClassName}
                    >
                      {tabInner}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Pane — only this region updates on section navigation */}
        <main
          className="relative isolate w-full contain-[layout]"
          role="tabpanel"
          id={`panel-${activeSectionId}`}
          aria-labelledby={`tab-${activeSectionId}`}
        >
          {sectionSlot ?? <ProfileSectionOutlet sectionId={activeSectionId} />}
        </main>
      </div>

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

      <LiveAgent variant="v2" embedded={embedded} cardData={liveAgentCardData} readyToConnect={introAllowed} />

      <LeaveMessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        ownerName={ownerName ?? 'the card owner'}
        design={design}
        embedded={embedded}
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
            onClose={() => setActiveModal(null)}
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
            onClose={() => setActiveModal(null)}
            onAction={(saved) => {
              console.log('Wallet saved:', saved)
              setActiveModal('notification')
            }}
          />
          <NotificationAskModal
            isOpen={activeModal === 'notification'}
            onClose={() => {
              localStorage.setItem(`vbizme_notif_${cardOwnerId}`, JSON.stringify({ asked: true, accepted: false }))
              setActiveModal(null)
            }}
            cardOwnerId={cardOwnerId ?? '91'}
            onAccept={(sub, preferences) => {
              localStorage.setItem(
                `vbizme_notif_${cardOwnerId}`,
                JSON.stringify({ asked: true, accepted: true, subscription: sub, preferences })
              )
              console.log('Permission accepted, preferences:', preferences)
              setActiveModal('done')
            }}
          />
          <NotificationSettingsModal
            isOpen={activeModal === 'settings'}
            onClose={() => setActiveModal(null)}
            cardOwnerId={cardOwnerId ?? '91'}
          />
          <DoneModal isOpen={activeModal === 'done'} onClose={() => setActiveModal(null)} />
        </>
      )}
    </div>
  )
}
