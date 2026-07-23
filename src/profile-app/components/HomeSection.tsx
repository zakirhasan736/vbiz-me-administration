'use client'

import { cornerStyleToRadius } from '@/lib/resolvedProfileDesign'
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Download,
  Eye,
  Facebook,
  Instagram,
  Linkedin,
  PlaySquare,
  QrCode,
  Share2,
  Star,
  StickyNote,
  Twitter,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { auth, db, isFirebaseAvailable } from '../lib/firebase'
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils'
import { useProfileDisplay } from '../lib/profileDisplayContext'
import { buildExtraFieldContactItems, buildProfileContactItems, splitDisplayName } from '../lib/profileHomeData'
import { resolveProfileAvatarSrc } from '../profilePublicProps'
import { CustomVideoPlayer } from './CustomVideoPlayer'
import { LeaveMessageModal } from './LeaveMessageModal'
import { SectionContainer } from './SectionContainer'

const DEFAULT_COVER = 'https://app.vbizme.com/storage/ecard/backgroundVideos/91/Untitled%20design-36.mp4'

const V1_SOCIAL_GRID = [
  { label: 'Twitter', icon: Twitter },
  { label: 'FaceBook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'Youtube', icon: PlaySquare },
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
      className={`group hover:border-yellow-primary/40 relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-linear-to-br from-black/3 to-black/1 p-4 backdrop-blur-[30px] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] sm:p-5 lg:rounded-4xl dark:border-white/10 dark:from-white/3 dark:to-white/1 dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ${!item.isLink ? 'cursor-pointer' : ''}`}
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

type PublishUser = Pick<User, 'uid'> & {
  displayName?: string | null
  email?: string | null
}

export const HomeSection = () => {
  const { personal, isVisible, field, pageColors, homeMedia, design, socialHref, extraFields, embedded } =
    useProfileDisplay()
  const showSaveContact = isVisible('Save Contact')
  const showShare = isVisible('Share Btn')
  const nameStyle = field('MyInfo section Name')
  const accent = design?.accentColor ?? '#dcc969'
  const cornerRadius = design ? cornerStyleToRadius(design.cornerStyle) : '16px'
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

  const contactItems = useMemo(() => {
    const base = buildProfileContactItems(personal, isVisible, field)
    const extra = buildExtraFieldContactItems(extraFields)
    return [...base, ...extra]
  }, [personal, isVisible, field, extraFields])

  const visibleSocials = V1_SOCIAL_GRID.filter((s) => isVisible(s.label) && Boolean(socialHref(s.label)))

  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const messageOwnerName = personal.fullName?.trim() || 'the card owner'

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Parallax Fix: Start higher and move within a safe range to avoid blank space
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const yContent = useTransform(scrollYProgress, [0, 1], ['0%', '-8%'])

  const handlePublish = async () => {
    try {
      let user: PublishUser | null = auth.currentUser

      if (!isFirebaseAvailable) {
        // Simulated Login for local dev if Firebase is missing
        console.log('Firebase unavailable. Using simulated login.')
        user = {
          uid: 'guest_user',
          displayName: 'Guest Profile',
          email: 'guest@vbizme.com',
        }
      } else if (!user) {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        user = result.user
      }

      if (!user) return

      if (isFirebaseAvailable) {
        const cardId = 'michaelangelo_casanova'
        const cardRef = doc(db, 'cards', cardId)
        const cardSnap = await getDoc(cardRef)

        if (cardSnap.exists()) {
          await updateDoc(cardRef, {
            lastUpdated: serverTimestamp(),
          })
        } else {
          await setDoc(cardRef, {
            ownerId: user.uid,
            name: 'Michaelangelo Casanova',
            lastUpdated: serverTimestamp(),
            isPublic: true,
          })
        }
      }

      window.dispatchEvent(
        new CustomEvent('vbiz_platform_update', {
          detail: {
            title: isFirebaseAvailable ? 'Update Published' : 'Simulated Update',
            message: `${user.displayName || 'Michaelangelo Casanova'} just updated his card with new services and links.${!isFirebaseAvailable ? ' (Local Mode Enabled)' : ''}`,
          },
        })
      )
    } catch (error) {
      if (isFirebaseAvailable) {
        handleFirestoreError(error, OperationType.WRITE, 'cards/michaelangelo_casanova')
      } else {
        console.error('Local mode error:', error)
      }
    }
  }

  return (
    <SectionContainer>
      <div ref={containerRef} className="flex h-full w-full flex-1 items-center justify-center px-4 pt-4 pb-12 sm:px-6">
        {/* Bento Grid Container */}
        <div className="mx-auto grid min-h-max w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative col-span-1 flex min-h-[450px] flex-col justify-end overflow-hidden rounded-4xl border border-black/5 bg-white p-5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] ring-1 ring-black/5 sm:min-h-[500px] sm:p-10 lg:col-span-8 lg:min-h-[580px] lg:rounded-[3rem] dark:border-white/5 dark:bg-gray-900 dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] dark:ring-white/5"
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

            <motion.div
              style={{ y: yContent }}
              className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
            >
              {/* Profile Details */}
              <div className="flex-1">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group/profile relative w-fit"
                >
                  <CustomVideoPlayer
                    src={profileSrc}
                    imageAlt={personal.fullName ? `${personal.fullName} profile` : 'Profile'}
                    className="mb-4 h-20 w-20 rounded-2xl border border-black/5 bg-white object-cover shadow-2xl backdrop-blur-md sm:mb-6 sm:h-32 sm:w-32 lg:h-36 lg:w-36 dark:border-white/20 dark:bg-gray-500"
                  />
                  {/* Verified Badge */}
                  <div className="bg-yellow-primary absolute -top-2 -right-2 z-20 rounded-full border-2 border-white p-1.5 text-black shadow-lg dark:border-gray-950">
                    <Star size={14} fill="currentColor" />
                  </div>
                  {/* Rim Light / Inner Glow on Hover */}
                  <div className="border-yellow-primary/0 group-hover/profile:border-yellow-primary/50 pointer-events-none absolute inset-0 rounded-2xl border-2 transition-all duration-500" />
                  <div className="bg-yellow-primary/10 absolute -inset-2 -z-10 opacity-0 blur-xl transition-opacity duration-500 group-hover/profile:opacity-100" />
                </motion.div>
                <div className="mb-1 flex items-center gap-3">
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
                    className="text-yellow-primary flex w-fit items-center rounded-full border border-black/5 bg-gray-50 px-3 py-1.5 text-[9px] font-bold tracking-[0.25em] uppercase drop-shadow-md backdrop-blur-xl sm:px-4 sm:py-2 sm:text-xs dark:border-white/10 dark:bg-white/5"
                    style={
                      field('MyInfo Profession').textColor ? { color: field('MyInfo Profession').textColor } : undefined
                    }
                  >
                    <TypewriterText text={professionLine} delay={500} speed={120} />
                  </p>
                ) : null}
              </div>

              {/* Action Floating Buttons */}
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
                    <div className="text-yellow-primary pointer-events-none absolute right-full mr-4 hidden translate-x-4 rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase opacity-0 backdrop-blur-md transition-all group-hover/btn:translate-x-0 group-hover/btn:opacity-100 lg:block dark:border-black/5 dark:bg-white/90">
                      Share Business
                    </div>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Mini Cards (Spans 4 cols on desktop) */}
          <div className="col-span-1 flex flex-col gap-6 lg:col-span-4 lg:gap-8">
            {/* Quick Actions Card */}
            <div className="group relative flex flex-col gap-5 overflow-hidden rounded-4xl border border-black/5 bg-white p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] backdrop-blur-3xl sm:p-8 dark:border-white/5 dark:bg-gray-900/40 dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]">
              <div className="from-yellow-primary/10 absolute inset-0 bg-linear-to-tr via-transparent to-black/1 opacity-0 transition-opacity duration-700 group-hover:opacity-100 dark:to-white/2" />

              <div className="relative z-10 flex flex-col gap-4">
                {showSaveContact && (
                  <motion.button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-save-contact-flow'))
                    }}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: accent,
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="group/btn from-yellow-primary hover:to-yellow-primary flex w-full items-center justify-between rounded-2xl bg-linear-to-r to-[#c2b05c] px-6 py-4.5 text-[10px] font-black tracking-[0.2em] text-black uppercase shadow-[0_20px_40px_-10px_rgba(234,179,8,0.3)] transition-all hover:from-[#ebd675] hover:shadow-[0_25px_50px_-10px_rgba(234,179,8,0.6)] sm:text-xs dark:shadow-[0_20px_40px_-10px_rgba(234,179,8,0.4)]"
                    style={{
                      borderRadius: cornerRadius,
                      background: `linear-gradient(to right, ${accent}, color-mix(in srgb, ${accent} 80%, black))`,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <Download size={18} strokeWidth={2.5} /> Add to Contacts
                    </span>
                    <div className="rounded-lg bg-gray-50 p-1.5">
                      <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                    </div>
                  </motion.button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)', y: -2 }}
                    onClick={handlePublish}
                    className="group/mini hover:text-yellow-primary flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-black/5 bg-gray-50 py-5 text-[8px] font-black tracking-[0.2em] text-gray-500 uppercase shadow-lg transition-all dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-black/10"
                  >
                    <QrCode size={20} className="transition-transform group-hover/mini:scale-110" />
                    <span>Sync</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)', y: -2 }}
                    className="group/mini hover:text-yellow-primary flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-black/5 bg-gray-50 py-5 text-[8px] font-black tracking-[0.2em] text-gray-500 uppercase shadow-lg transition-all dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-black/10"
                  >
                    <Briefcase size={20} className="transition-transform group-hover/mini:scale-110" />
                    <span>Works</span>
                  </motion.button>
                </div>
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
              <div className="group relative flex flex-1 flex-col justify-center gap-6 overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/50">
                <div className="from-yellow-primary/5 absolute -inset-3 bg-linear-to-b to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <h3 className="text-xs font-semibold tracking-widest text-gray-500 uppercase dark:text-white/60">
                  Connect
                </h3>
                <div className="grid grid-cols-5 gap-3">
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
                        className="flex aspect-square items-center justify-center rounded-full border border-black/5 bg-gray-50 text-gray-500 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:text-white"
                        style={socialInlineStyle}
                      >
                        <item.icon size={18} fill="currentColor" className="opacity-90 transition-none" />
                      </a>
                    )
                  })}
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
            className="col-span-1 lg:col-span-12"
          >
            {contactItems.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6 lg:gap-5">
                {contactItems.map((item, idx) => (
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
        design={design}
        embedded={embedded}
      />
    </SectionContainer>
  )
}
