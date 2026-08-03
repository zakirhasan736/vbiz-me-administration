'use client'

import { LANGUAGE_LABELS } from '@/lib/i18n/translation'
import { useTranslation } from '@/lib/i18n/translationData'
import {
  ArrowUpRight,
  Bell,
  Eye,
  Facebook,
  FileText,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Moon,
  PlaySquare,
  Share2,
  Star,
  StickyNote,
  Twitter,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useProfileDisplay } from '../lib/profileDisplayContext'
import { openVbizmeLogin } from '../lib/profileExternalLinks'
import { buildBentoContactItems, formatProfileViewCount, splitDisplayName } from '../lib/profileHomeData'
import { filterSocialItemsWithLinks, resolveSocialLinkHref } from '../lib/profileSocialLinks'
import { resolveProfileAvatarSrc } from '../profilePublicProps'
import { CustomVideoPlayer } from './CustomVideoPlayer'
import { LeaveMessageModal } from './LeaveMessageModal'
import { ProfileActionButtons } from './ProfileActionButtons'
import { SectionContainer } from './SectionContainer'

const DEFAULT_COVER = 'https://app.vbizme.com/storage/ecard/backgroundVideos/91/Untitled%20design-36.mp4'

const V1_SOCIAL_GRID = [
  { label: 'Twitter', icon: Twitter },
  { label: 'FaceBook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'Whatsapp', icon: MessageCircle },
  { label: 'TikTok', icon: Globe },
  { label: 'Youtube', icon: PlaySquare },
  { label: 'Pinterest', icon: Globe },
  { label: 'Rumble', icon: Globe },
  { label: 'Truth', icon: Globe },
  { label: 'Website', icon: Globe },
] as const

const TypewriterText = ({ text, delay = 0, speed = 100 }: { text: string; delay?: number; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [startTyping, setStartTyping] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStartTyping(true)
    }, delay)
    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!startTyping) return
    let i = 0
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [text, startTyping, speed])

  return (
    <span className="inline-flex min-h-[1.5em] items-center">
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="bg-yellow-primary ml-1.5 inline-block h-[1.1em] w-[3px]"
      />
    </span>
  )
}

type ContactDetailItemData = {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  isLink?: boolean
  href?: string
  colSpan?: 1 | 2
  style?: { textColor?: string; backgroundColor?: string; iconColor?: string }
}

const ContactDetailItem: React.FC<{ item: ContactDetailItemData }> = ({ item }) => {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (item.isLink) return
    e.preventDefault()
    navigator.clipboard.writeText(item.value)
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 2000)
  }

  const textStyle = item.style?.textColor ? { color: item.style.textColor } : undefined
  const bgStyle = item.style?.backgroundColor ? { backgroundColor: item.style.backgroundColor } : undefined
  const iconStyle = item.style?.iconColor ? { color: item.style.iconColor } : undefined

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
      }}
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className={`group hover:border-yellow-primary/40 relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-linear-to-br from-black/3 to-black/1 p-4 backdrop-blur-[30px] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] sm:p-5 lg:rounded-4xl dark:border-white/10 dark:from-white/3 dark:to-white/1 dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ${item.colSpan === 2 ? 'col-span-2 lg:col-span-1' : ''} ${!item.isLink ? 'cursor-pointer' : ''}`}
      style={bgStyle}
    >
      {/* Subtle Shimmer & Glow Overlay */}
      <div className="from-yellow-primary/5 absolute inset-0 bg-linear-to-tr via-transparent to-black/1 opacity-0 transition-opacity duration-700 group-hover:opacity-100 dark:to-white/2" />

      {/* Success Feedback for Copying */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-yellow-primary absolute inset-0 z-50 flex items-center justify-center text-[10px] font-black tracking-widest text-black uppercase"
          >
            Copied!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-center justify-between">
          <div
            className="group-hover:border-yellow-primary group-hover:bg-yellow-primary flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 bg-gray-50 text-gray-500 shadow-inner transition-all duration-500 group-hover:rotate-10 group-hover:text-black lg:h-11 lg:w-11 dark:border-white/10 dark:bg-white/5 dark:text-white/50"
            style={iconStyle}
          >
            <item.icon size={18} strokeWidth={1.5} className="group-hover:stroke-2" />
          </div>
          <div className="text-yellow-primary/40 group-hover:text-yellow-primary rounded-md border border-black/5 bg-gray-50 px-2 py-1 text-[7px] font-black tracking-[0.3em] uppercase transition-colors lg:text-[8px] dark:border-white/5 dark:bg-white/5">
            {item.detail}
          </div>
        </div>

        <div className="mt-auto">
          <span
            className="mb-1.5 block text-[7px] font-black tracking-[0.25em] text-gray-500 uppercase opacity-80 transition-opacity group-hover:opacity-100 lg:text-[8px] dark:text-white/20"
            style={textStyle}
          >
            {item.label}
          </span>
          {item.isLink ? (
            <a
              href={item.href}
              onClick={(e) => e.stopPropagation()}
              className="group/link hover:text-yellow-primary flex items-center gap-1 truncate text-xs font-semibold text-gray-900 transition-all lg:text-[14px] dark:text-white/90"
              style={textStyle}
            >
              {item.value}
              <ArrowUpRight
                size={12}
                className="translate-x-1 -translate-y-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-hover/link:opacity-100"
              />
            </a>
          ) : (
            <span
              className="block truncate text-xs font-semibold tracking-wide text-gray-900 lg:text-[14px] dark:text-white/90"
              style={textStyle}
            >
              {item.value}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const GeometricPattern = () => (
  <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-[0.25]">
    {/* Refined Geometric Wireframe (Inspired by user attachment) */}
    <div className="absolute top-0 bottom-0 left-[12%] w-px bg-linear-to-b from-transparent via-white/30 to-transparent" />
    <div className="absolute top-[8%] left-[12%] h-40 w-40 border-t border-l border-black/20 dark:border-white/20" />
    <div className="absolute top-[8%] left-[12%] h-20 w-20 translate-x-1/2 -translate-y-1/2 border border-white/30" />

    <div className="absolute top-0 right-[12%] bottom-0 w-px bg-linear-to-b from-transparent via-white/30 to-transparent" />
    <div className="absolute top-[65%] right-[12%] h-48 w-48 translate-x-0 border-r border-b border-black/20 dark:border-white/20" />
    <div className="border-yellow-primary/30 absolute top-[65%] right-[12%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rotate-45 border" />

    {/* Horizontal Structural Accents */}
    <div className="absolute top-[30%] right-0 left-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
    <div className="absolute top-[70%] right-0 left-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

    {/* Glowing Nodes */}
    <motion.div
      animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.5, 1] }}
      transition={{ duration: 5, repeat: Infinity }}
      className="bg-yellow-primary absolute top-[40%] left-[12%] h-2 w-2 -translate-x-1/2 rounded-full shadow-[0_0_15px_#dcc969] blur-[2px]"
    />
    <motion.div
      animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.5, 1] }}
      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      className="bg-yellow-primary absolute top-[25%] right-[12%] h-2 w-2 translate-x-1/2 rounded-full shadow-[0_0_15px_#dcc969] blur-[2px]"
    />
  </div>
)

type V1HomeHeroProps = {
  theme: 'light' | 'dark'
  onAction: (action: string) => void
  toggleTheme: () => void
}

type HomeSectionProps = {
  homeHeroProps?: V1HomeHeroProps
}

export const HomeSection = ({ homeHeroProps }: HomeSectionProps) => {
  const { lang } = useTranslation()
  const { personal, isVisible, field, pageColors, homeMedia, design, socialHref, embedded, cardOwnerId, profileViews } =
    useProfileDisplay()
  const showShare = isVisible('Share Btn')
  const nameStyle = field('MyInfo section Name')
  const accent = design?.accentColor ?? '#dcc969'

  const coverSrc = homeMedia.bgMedia || DEFAULT_COVER
  const introSrc = homeMedia.introVideo || personal.explainerVideoUrl || undefined
  const profileSrc = useMemo(
    () => resolveProfileAvatarSrc(homeMedia.profileMedia, introSrc),
    [homeMedia.profileMedia, introSrc]
  )
  const { first: nameFirst, rest: nameRest } = splitDisplayName(
    isVisible('MyInfo section Name') ? personal.fullName : ''
  )
  const professionLine =
    (isVisible('MyInfo Designation') && personal.designation) ||
    (isVisible('MyInfo Profession') && personal.profession) ||
    (isVisible('MyInfo Company') && personal.company) ||
    ''

  const bentoContactItems = useMemo(
    () => buildBentoContactItems(personal, isVisible, field),
    [personal, isVisible, field]
  )

  const websiteHref = useMemo(() => resolveSocialLinkHref('Website', socialHref).trim(), [socialHref])

  const visibleSocials = filterSocialItemsWithLinks(V1_SOCIAL_GRID, socialHref, personal.whatsapp).filter(
    (item) => item.label !== 'Website'
  )

  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const messageOwnerName = personal.fullName?.trim() || 'the card owner'
  const currentLanguage = (LANGUAGE_LABELS[lang]?.flag ?? lang.toUpperCase()).slice(0, 2)

  const triggerAction = (action: string) => {
    homeHeroProps?.onAction(action)
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Parallax Fix: Start higher and move within a safe range to avoid blank space
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const yContent = useTransform(scrollYProgress, [0, 1], ['0%', '-8%'])

  return (
    <SectionContainer>
      <div
        ref={containerRef}
        className="flex h-full w-full flex-1 items-center justify-center px-4 pt-4 pb-12 sm:px-6 md:pt-12"
      >
        {/* Bento Grid Container */}
        <div className="mx-auto grid min-h-max w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative col-span-1 flex min-h-[70vh] flex-col justify-end overflow-hidden rounded-4xl border border-black/5 bg-white p-5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] ring-1 ring-black/5 sm:min-h-[500px] sm:p-10 lg:col-span-8 lg:min-h-[580px] lg:rounded-[3rem] dark:border-white/5 dark:bg-gray-900 dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] dark:ring-white/5"
            style={pageColors.pageBanner ? { backgroundColor: pageColors.pageBanner } : undefined}
          >
            {/* Ambient Glow */}
            <div className="from-yellow-primary/15 to-yellow-primary/5 pointer-events-none absolute -inset-1 -z-10 bg-linear-to-br via-transparent opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />

            {/* Background Video Layer */}
            <motion.div
              style={{ y: yBg }}
              className="absolute top-[-20%] right-0 left-0 z-0 h-[120%] overflow-hidden bg-white dark:bg-gray-900"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full scale-105 object-cover opacity-30 mix-blend-multiply transition-all duration-[10s] group-hover:scale-110 group-hover:saturate-125 dark:opacity-60 dark:mix-blend-screen"
              >
                <source src={coverSrc} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-linear-to-t from-white via-white/40 to-transparent dark:from-gray-950 dark:via-gray-950/40" />
              <div className="absolute inset-0 bg-linear-to-r from-white/90 via-transparent to-transparent dark:from-gray-950/90" />

              {/* Geometric Pattern Overlay */}
              <GeometricPattern />
            </motion.div>

            {/* Top-right hero actions (first-template desktop) */}
            {homeHeroProps ? (
              <div className="absolute top-6 right-6 z-50 hidden shrink-0 flex-col gap-3 sm:flex">
                {[
                  ...(showShare ? [{ icon: Share2, label: 'Share', action: () => triggerAction('share') }] : []),
                  {
                    icon: Eye,
                    label: 'Views',
                    badge: (
                      <div className="absolute -top-1.5 -right-3 z-20 rounded-full bg-[#b91c1c] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md">
                        {formatProfileViewCount(profileViews)}
                      </div>
                    ),
                    action: () => openVbizmeLogin(),
                  },
                  ...(websiteHref
                    ? [
                        {
                          icon: Globe,
                          label: 'Website',
                          action: () => window.open(websiteHref, '_blank', 'noopener,noreferrer'),
                        },
                      ]
                    : []),
                  {
                    content: (
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-[11px] font-black text-gray-700 dark:text-gray-300">
                          {currentLanguage}
                        </span>
                        <span className="text-yellow-primary text-[8px] font-bold">LANG</span>
                      </div>
                    ),
                    label: 'Language',
                    action: () => triggerAction('language'),
                  },
                  {
                    icon: Moon,
                    label: 'Theme',
                    action: () => homeHeroProps.toggleTheme(),
                  },
                ].map((action, idx) => (
                  <motion.button
                    key={`${action.label}-${idx}`}
                    type="button"
                    onClick={action.action}
                    whileHover={{
                      scale: 1.15,
                      rotate: idx % 2 === 0 ? 10 : -10,
                      backgroundColor: accent,
                      color: 'rgba(0, 0, 0, 1)',
                      boxShadow: `0 0 20px color-mix(in srgb, ${accent} 40%, transparent)`,
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="group/btn border-yellow-primary/50 dark:border-yellow-primary/40 relative flex h-12 w-12 items-center justify-center overflow-visible rounded-full border-2 bg-white/80 text-gray-700 shadow-lg backdrop-blur-2xl transition-all duration-500 dark:bg-black/40 dark:text-gray-300"
                  >
                    {'icon' in action && action.icon ? (
                      <action.icon
                        size={18}
                        className="relative z-10 transition-transform group-hover/btn:scale-110"
                        strokeWidth={2.5}
                      />
                    ) : null}
                    {'content' in action && action.content ? (
                      <div className="relative z-10">{action.content}</div>
                    ) : null}
                    {'badge' in action ? action.badge : null}
                    <div className="text-yellow-primary pointer-events-none absolute right-full z-30 mr-4 hidden translate-x-4 rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase opacity-0 shadow-xl backdrop-blur-md transition-all group-hover/btn:translate-x-0 group-hover/btn:opacity-100 lg:block dark:border-black/5 dark:bg-white/90">
                      {action.label}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : null}

            <motion.div
              style={{ y: yContent }}
              className="relative z-10 flex w-full flex-col items-center justify-between gap-6 sm:flex-row sm:items-end"
            >
              {/* Mobile social icons (left column) */}
              {visibleSocials.length > 0 ? (
                <div className="absolute top-0 left-0 z-50 flex shrink-0 flex-col gap-2 sm:hidden">
                  {visibleSocials.slice(0, 5).map((item, idx) => (
                    <motion.a
                      key={`${item.label}-${idx}`}
                      href={socialHref(item.label)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="vbiz-social flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-2xl"
                    >
                      <item.icon size={16} fill="currentColor" />
                    </motion.a>
                  ))}
                </div>
              ) : null}

              {/* Mobile quick actions (right column) */}
              {homeHeroProps ? (
                <div className="absolute top-0 right-0 z-50 flex shrink-0 flex-col gap-2 sm:hidden">
                  {[
                    {
                      icon: Eye,
                      label: 'Views',
                      badge: (
                        <div className="absolute -top-1.5 -right-3 z-20 rounded-full bg-[#b91c1c] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md">
                          {formatProfileViewCount(profileViews)}
                        </div>
                      ),
                      action: () => openVbizmeLogin(),
                    },
                    ...(websiteHref
                      ? [
                          {
                            icon: Globe,
                            label: 'Website',
                            action: () => window.open(websiteHref, '_blank', 'noopener,noreferrer'),
                          },
                        ]
                      : []),
                    {
                      content: (
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="text-[11px] font-black text-gray-700 dark:text-gray-300">
                            {currentLanguage}
                          </span>
                          <span className="text-yellow-primary text-[8px] font-bold">LANG</span>
                        </div>
                      ),
                      label: 'Language',
                      action: () => triggerAction('language'),
                    },
                    {
                      icon: Moon,
                      label: 'Theme',
                      action: () => homeHeroProps.toggleTheme(),
                    },
                  ].map((action, idx) => (
                    <motion.button
                      key={`${action.label}-${idx}`}
                      type="button"
                      onClick={action.action}
                      whileTap={{ scale: 0.9 }}
                      className="border-yellow-primary/50 dark:border-yellow-primary/40 relative flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white/80 text-gray-700 shadow-lg backdrop-blur-2xl dark:bg-black/40 dark:text-gray-300"
                    >
                      {'icon' in action && action.icon ? <action.icon size={16} strokeWidth={2.5} /> : null}
                      {'content' in action && action.content ? action.content : null}
                      {'badge' in action ? action.badge : null}
                    </motion.button>
                  ))}
                </div>
              ) : null}

              {/* Profile Details */}
              <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group/profile relative mx-auto w-fit sm:mx-0"
                >
                  <CustomVideoPlayer
                    src={profileSrc}
                    imageAlt={personal.fullName ? `${personal.fullName} profile` : 'Profile'}
                    controlsMode="owner"
                    showSeekBar={false}
                    className="mb-4 h-48 w-32 rounded-2xl border border-black/5 bg-white object-cover shadow-2xl backdrop-blur-md sm:mb-6 sm:h-48 sm:w-32 lg:h-56 lg:w-40 dark:border-white/20 dark:bg-gray-500"
                  />
                  {/* Verified Badge */}
                  <div className="bg-yellow-primary absolute -top-2 -right-2 z-20 rounded-full border-2 border-white p-1.5 text-black shadow-lg dark:border-gray-950">
                    <Star size={14} fill="currentColor" />
                  </div>
                  {/* Rim Light / Inner Glow on Hover */}
                  <div className="border-yellow-primary/0 group-hover/profile:border-yellow-primary/50 pointer-events-none absolute inset-0 rounded-2xl border-2 transition-all duration-500" />
                  <div className="bg-yellow-primary/10 absolute -inset-2 -z-10 opacity-0 blur-xl transition-opacity duration-500 group-hover/profile:opacity-100" />
                </motion.div>
                <div className="mb-1 flex items-center justify-center gap-3 sm:justify-start">
                  <span className="border-yellow-primary/20 bg-yellow-primary/10 text-yellow-primary rounded-md border px-2 py-0.5 text-[8px] font-black tracking-widest uppercase">
                    Verified Profile
                  </span>
                </div>
                {isVisible('MyInfo section Name') && personal.fullName ? (
                  <h1
                    className="font-heading mb-2 text-3xl leading-[1.05] font-bold tracking-tight text-gray-900 drop-shadow-xl sm:mb-3 sm:text-5xl lg:text-7xl dark:text-white"
                    style={nameStyle.textColor ? { color: nameStyle.textColor } : undefined}
                  >
                    {nameFirst}
                    {nameRest ? (
                      <>
                        <br />
                        <span
                          className="text-yellow-primary drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                          style={nameStyle.textColor ? { color: nameStyle.textColor } : undefined}
                        >
                          {nameRest}
                        </span>
                      </>
                    ) : null}
                  </h1>
                ) : (
                  <h1 className="font-heading mb-2 text-3xl leading-[1.05] font-bold tracking-tight text-gray-900 drop-shadow-xl sm:mb-3 sm:text-5xl lg:text-7xl dark:text-white">
                    Michaelangelo
                    <br />
                    <span className="text-yellow-primary drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">Casanova</span>
                  </h1>
                )}
                {professionLine ? (
                  <p
                    className="text-yellow-primary mx-auto flex w-fit items-center rounded-full border border-black/5 bg-gray-50 px-3 py-1.5 text-[9px] font-bold tracking-[0.25em] uppercase drop-shadow-md backdrop-blur-xl sm:mx-0 sm:px-4 sm:py-2 sm:text-xs dark:border-white/10 dark:bg-white/5"
                    style={
                      field('MyInfo Profession').textColor ? { color: field('MyInfo Profession').textColor } : undefined
                    }
                  >
                    <TypewriterText text={professionLine} delay={500} speed={120} />
                  </p>
                ) : null}

                {homeHeroProps ? (
                  <div className="mt-4 flex w-full items-center justify-center gap-3 md:hidden">
                    {[
                      ...(showShare
                        ? [
                            {
                              icon: Share2,
                              hover: 'hover:bg-blue-500 hover:border-blue-500 hover:text-white text-blue-500',
                              onClick: () => triggerAction('share'),
                            },
                          ]
                        : []),
                      {
                        icon: Bell,
                        hover: 'hover:bg-amber-500 hover:border-amber-500 hover:text-white text-amber-500',
                        onClick: () => triggerAction('settings'),
                      },
                      {
                        icon: FileText,
                        hover: 'hover:bg-emerald-500 hover:border-emerald-500 hover:text-white text-emerald-500',
                        onClick: () => triggerAction('notepad'),
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={item.onClick}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 shadow-md backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-gray-900/80 ${item.hover}`}
                      >
                        <item.icon size={18} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Action Floating Buttons */}
              {!homeHeroProps ? (
                <div className="flex shrink-0 gap-4 sm:flex-col">
                  <motion.button
                    type="button"
                    onClick={() => setMessageModalOpen(true)}
                    whileHover={{
                      scale: 1.15,
                      rotate: -10,
                      backgroundColor: accent,
                      color: 'rgba(0, 0, 0, 1)',
                      boxShadow: `0 0 30px color-mix(in srgb, ${accent} 40%, transparent)`,
                    }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Leave a message"
                    className="group/btn relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-gray-50 text-gray-500 backdrop-blur-2xl transition-all duration-500 lg:h-14 lg:w-14 dark:border-white/20 dark:bg-white/5 dark:text-white/90"
                  >
                    <div className="absolute inset-0 bg-linear-to-tr from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100 dark:from-white/20" />
                    <StickyNote size={22} className="relative z-10 transition-transform group-hover/btn:scale-110" />
                    <div className="text-yellow-primary pointer-events-none absolute right-full mr-4 hidden translate-x-4 rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase opacity-0 backdrop-blur-md transition-all group-hover/btn:translate-x-0 group-hover/btn:opacity-100 lg:block dark:border-black/5 dark:bg-white/90">
                      Leave Message
                    </div>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => openVbizmeLogin()}
                    whileHover={{
                      scale: 1.15,
                      rotate: 15,
                      backgroundColor: accent,
                      color: 'rgba(0, 0, 0, 1)',
                      boxShadow: `0 0 30px color-mix(in srgb, ${accent} 40%, transparent)`,
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="group/btn relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-gray-50 text-gray-500 backdrop-blur-2xl transition-all duration-500 lg:h-14 lg:w-14 dark:border-white/20 dark:bg-white/5 dark:text-white/90"
                  >
                    <div className="absolute inset-0 bg-linear-to-tr from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100 dark:from-white/20" />
                    <Eye size={22} className="relative z-10 transition-transform group-hover/btn:scale-110" />
                    <div className="text-yellow-primary pointer-events-none absolute right-full mr-4 hidden translate-x-4 rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase opacity-0 backdrop-blur-md transition-all group-hover/btn:translate-x-0 group-hover/btn:opacity-100 lg:block dark:border-black/5 dark:bg-white/90">
                      Preview Card
                    </div>
                  </motion.button>
                  {showShare && (
                    <motion.button
                      type="button"
                      onClick={() => triggerAction('share')}
                      whileHover={{
                        scale: 1.15,
                        rotate: -15,
                        backgroundColor: accent,
                        color: 'rgba(0, 0, 0, 1)',
                        boxShadow: `0 0 30px color-mix(in srgb, ${accent} 40%, transparent)`,
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="group/btn relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-gray-50 text-gray-500 backdrop-blur-2xl transition-all duration-500 lg:h-14 lg:w-14 dark:border-white/20 dark:bg-white/5 dark:text-white/90"
                    >
                      <div className="absolute inset-0 bg-linear-to-tr from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100 dark:from-white/20" />
                      <Share2 size={22} className="relative z-10 transition-transform group-hover/btn:scale-110" />
                    </motion.button>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>

          {/* Right Column: Mini Cards (Spans 4 cols on desktop) */}
          <div className="col-span-1 flex flex-col-reverse gap-6 md:flex-col lg:col-span-4 lg:gap-8">
            {/* Quick Actions Card */}
            <div className="group relative flex flex-col gap-5 overflow-hidden rounded-4xl border border-black/5 bg-white px-[14px] py-5 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] backdrop-blur-3xl sm:p-8 dark:border-white/5 dark:bg-gray-900/40 dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]">
              <div className="from-yellow-primary/10 absolute inset-0 bg-linear-to-tr via-transparent to-black/1 opacity-0 transition-opacity duration-700 group-hover:opacity-100 dark:to-white/2" />

              <div className="relative z-10 flex flex-1 flex-col">
                <ProfileActionButtons
                  theme={homeHeroProps?.theme}
                  onAction={homeHeroProps?.onAction}
                  className="w-full"
                  mobileClassName="mx-auto w-full max-w-none shadow-none mb-0"
                />
              </div>

              <div className="mt-2 flex flex-col items-center gap-3 border-t border-black/5 pt-4 dark:border-white/5">
                <span className="text-[7px] font-black tracking-[0.4em] text-gray-500 uppercase dark:text-white/20">
                  Digital Identity Experience
                </span>
                <button className="text-yellow-primary/40 hover:text-yellow-primary text-[9px] font-black tracking-[0.3em] uppercase transition-colors">
                  Join vBiz Ecosystem
                </button>
              </div>
            </div>

            {/* Social Links Card */}
            {visibleSocials.length > 0 && (
              <div className="group relative hidden flex-1 flex-col justify-center gap-6 overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-2xl backdrop-blur-xl md:flex dark:border-white/10 dark:bg-gray-900/50">
                <div className="from-yellow-primary/5 pointer-events-none absolute -inset-3 bg-linear-to-b to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-semibold tracking-widest text-gray-500 uppercase dark:text-white/60">
                    Connect
                  </h3>
                  <div className="grid grid-cols-5 gap-1">
                    {visibleSocials.map((item, idx) => {
                      const socialStyle = field(item.label)
                      const iconColor = socialStyle.iconColor ?? socialStyle.textColor
                      const socialInlineStyle =
                        iconColor || socialStyle.backgroundColor
                          ? {
                              ...(iconColor ? { color: iconColor } : {}),
                              ...(socialStyle.backgroundColor ? { backgroundColor: socialStyle.backgroundColor } : {}),
                            }
                          : undefined
                      const href = socialHref(item.label)
                      return (
                        <a
                          key={idx}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vbiz-social flex h-10 w-10 items-center justify-center justify-self-center rounded-full shadow-xl transition-all duration-300 hover:-translate-y-1"
                          style={socialInlineStyle}
                        >
                          <item.icon size={16} fill="currentColor" className="opacity-90 transition-none" />
                        </a>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-black/5 pt-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold tracking-widest text-gray-500 uppercase dark:text-white/60">
                    Actions
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ...(showShare
                        ? [
                            {
                              icon: Share2,
                              label: 'Share',
                              hover: 'hover:bg-blue-500 hover:border-blue-500 hover:text-white',
                              onClick: () => triggerAction('share'),
                            },
                          ]
                        : []),
                      {
                        icon: Bell,
                        label: 'Alerts',
                        hover: 'hover:bg-amber-500 hover:border-amber-500 hover:text-white',
                        onClick: () => triggerAction('settings'),
                      },
                      {
                        icon: FileText,
                        label: 'Notes',
                        hover: 'hover:bg-emerald-500 hover:border-emerald-500 hover:text-white',
                        onClick: () => triggerAction('notepad'),
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={item.onClick}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-black/5 bg-gray-50 py-3 text-gray-500 shadow-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-white/80 ${item.hover}`}
                      >
                        <item.icon size={18} />
                        <span className="text-[10px] leading-none font-extrabold tracking-widest uppercase">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Grid (Refined Bento Design) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  when: 'beforeChildren',
                  staggerChildren: 0.08,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
            className="col-span-1 hidden md:block lg:col-span-12"
          >
            {bentoContactItems.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6 lg:gap-5">
                {bentoContactItems.map((item, idx) => (
                  <ContactDetailItem key={idx} item={item} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <LeaveMessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        ownerName={messageOwnerName}
        profileId={cardOwnerId}
        design={design}
        embedded={embedded}
      />
    </SectionContainer>
  )
}
