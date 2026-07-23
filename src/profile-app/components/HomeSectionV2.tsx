import { cornerStyleToRadius } from '@/lib/resolvedProfileDesign'
import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  ExternalLink,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  MessageCircle,
  QrCode,
  Twitter,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useMemo, useState } from 'react'
import { auth, db, isFirebaseAvailable } from '../lib/firebase'
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils'
import { useProfileDisplay } from '../lib/profileDisplayContext'
import { buildExtraFieldContactItems, buildProfileContactItems } from '../lib/profileHomeData'

type PublishUser = Pick<User, 'uid'> & {
  displayName?: string | null
  email?: string | null
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
    <div
      onClick={handleClick}
      className={`group relative flex items-center rounded-xl p-3 transition-all duration-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 ${!item.isLink ? 'cursor-pointer active:scale-95' : ''}`}
      style={bgStyle}
    >
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-[#eab308] text-xs font-bold tracking-wider text-zinc-950 uppercase"
          >
            Copied!
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        style={iconStyle}
      >
        <item.icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-zinc-500" style={textStyle}>
          {item.label}
        </span>
        {item.isLink ? (
          <a
            href={item.href}
            onClick={(e) => e.stopPropagation()}
            className="group/link flex items-center gap-1 truncate text-sm font-semibold text-zinc-900 transition-colors hover:text-[#eab308] dark:text-zinc-100 dark:hover:text-[#eab308]"
            style={textStyle}
          >
            {item.value}
            <ArrowUpRight
              size={14}
              className="translate-x-1 -translate-y-1 text-zinc-400 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-hover/link:text-[#eab308] group-hover/link:opacity-100"
            />
          </a>
        ) : (
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100" style={textStyle}>
            {item.value}
          </span>
        )}
      </div>

      <div className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-500">
        {item.detail}
      </div>
    </div>
  )
}

const SOCIAL_GRID: { label: string; icon: LucideIcon }[] = [
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'Twitter', icon: Twitter },
  { label: 'Instagram', icon: Instagram },
  { label: 'Website', icon: Globe },
]

export const HomeSectionV2 = () => {
  const { personal, isVisible, field, pageColors, homeMedia, design, socialHref, extraFields } = useProfileDisplay()
  const showSaveContact = isVisible('Save Contact')
  const nameStyle = field('MyInfo section Name')
  const cornerRadius = design ? cornerStyleToRadius(design.cornerStyle) : '16px'
  const accent = design?.accentColor ?? '#eab308'

  const contactItems = useMemo(() => {
    const base = buildProfileContactItems(personal, isVisible, field) as ContactDetailItemData[]
    const extra = buildExtraFieldContactItems(extraFields) as ContactDetailItemData[]
    return [...base, ...extra]
  }, [personal, isVisible, field, extraFields])

  const visibleSocials = SOCIAL_GRID.filter((s) => isVisible(s.label) && Boolean(socialHref(s.label)))

  const handlePublish = async () => {
    try {
      let user: PublishUser | null = auth.currentUser
      if (!isFirebaseAvailable) {
        user = { uid: 'guest_user', displayName: 'Guest Profile', email: 'guest@vbizme.com' }
      } else if (!user) {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        user = result.user
      }
      if (!user) return

      if (isFirebaseAvailable) {
        const cardRef = doc(db, 'cards', 'michaelangelo_casanova')
        const cardSnap = await getDoc(cardRef)
        if (cardSnap.exists()) {
          await updateDoc(cardRef, { lastUpdated: serverTimestamp() })
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
          detail: { title: 'Update Published', message: 'Card synced via quick action.' },
        })
      )
    } catch (error: unknown) {
      if (isFirebaseAvailable) {
        if (error instanceof FirebaseError && error.code === 'auth/popup-closed-by-user') {
          return
        }
        handleFirestoreError(error, OperationType.WRITE, 'cards')
      }
    }
  }

  const bannerBg = pageColors.pageBanner
  const bgVideoSrc = homeMedia.bgMedia || 'https://app.vbizme.com/storage/ecard/profileimages/91/mc%20vbizme.mp4'

  return (
    <div className="vbiz-bento-grid grid w-full grid-cols-1 gap-4 pb-20 md:grid-cols-3 lg:grid-cols-4">
      {/* Bio / Intro Card - Takes up 3 cols on desktop */}
      <div
        className="group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 md:col-span-3 lg:col-span-3 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900"
        style={bannerBg ? { backgroundColor: bannerBg } : undefined}
      >
        {/* Background Video */}
        <div className="absolute inset-0 h-full w-full bg-zinc-950">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-2000 group-hover:scale-105 group-hover:opacity-70"
          >
            <source src={bgVideoSrc} type="video/mp4" />
          </video>
          {/* Subtle overlay for text readability */}
          <div className="pointer-events-none absolute inset-0 bg-zinc-950/60" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-white via-white/40 to-transparent dark:from-zinc-950 dark:via-zinc-950/40" />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-800/20 to-transparent" />
        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#eab308] shadow-[0_0_8px_#eab308]" /> Available
            for Work
          </div>
          {isVisible('MyInfo section Name') && personal.fullName ? (
            <h2
              className="mb-6 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100"
              style={nameStyle.textColor ? { color: nameStyle.textColor } : undefined}
            >
              {personal.fullName}
            </h2>
          ) : (
            <h2 className="mb-6 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              Building digital <span className="font-medium text-zinc-400 italic dark:text-zinc-500">experiences</span>{' '}
              that drive <span className="text-[#eab308]">growth.</span>
            </h2>
          )}
          {isVisible('About Me') && personal.about ? (
            <p
              className="mb-10 max-w-xl text-sm leading-relaxed font-medium text-zinc-600 lg:text-base dark:text-zinc-400"
              style={field('About Me').textColor ? { color: field('About Me').textColor } : undefined}
            >
              {personal.about}
            </p>
          ) : (
            <p className="mb-10 max-w-xl text-sm leading-relaxed font-medium text-zinc-600 lg:text-base dark:text-zinc-400">
              As the CEO of vBiz Me, I specialize in transforming how professionals present themselves online with
              state-of-the-art interactive business cards.
            </p>
          )}
        </div>

        <div className="relative z-10 mt-auto flex w-full flex-wrap items-center gap-4">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 sm:flex-none dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            style={{ borderRadius: cornerRadius }}
          >
            <MessageCircle size={18} /> {`Let's Chat`}
          </button>
          <button
            onClick={handlePublish}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-8 py-4 text-sm font-bold text-zinc-900 shadow-sm backdrop-blur-sm transition-all hover:bg-zinc-100 hover:text-zinc-950 active:scale-95 sm:flex-none dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <QrCode size={18} /> Sync
          </button>
        </div>
      </div>

      {/* Primary Contact Square */}
      {showSaveContact && (
        <div
          className="group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-[#eab308] to-[#ca8a04] p-6 text-center text-[#09090b] transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(234,179,8,0.3)] md:col-span-3 lg:col-span-1 lg:p-8"
          style={{
            borderRadius: cornerRadius,
            background: `linear-gradient(to bottom right, ${accent}, color-mix(in srgb, ${accent} 75%, black))`,
          }}
        >
          <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 rounded-full bg-white/20 p-12 blur-3xl transition-transform duration-700 group-hover:scale-150" />
          <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/5 bg-[#09090b]/10 text-[#09090b] shadow-sm backdrop-blur-md transition-transform duration-500 group-hover:-translate-y-1">
            <Download size={28} />
          </div>
          <div className="relative z-10 mt-auto w-full">
            <h3 className="mb-2 text-2xl font-bold tracking-tight lg:text-3xl">Save Contact</h3>
            <p className="mb-6 text-sm font-semibold opacity-80">Add to phonebook</p>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#09090b] px-4 py-4 text-xs font-bold tracking-wider text-[#eab308] uppercase shadow-md transition-all group-hover:shadow-lg hover:bg-[#111] active:scale-95">
              vCard <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* Details List */}
      {contactItems.length > 0 && (
        <div className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 backdrop-blur-xl transition-colors duration-500 hover:bg-white/80 md:col-span-2 lg:col-span-2 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-linear-to-r from-zinc-100/50 to-transparent p-6 dark:border-zinc-800/80 dark:from-zinc-800/20">
            <h3 className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">Contact Details</h3>
            <span className="rounded-md border border-[#eab308]/20 bg-[#eab308]/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#eab308] uppercase">
              Verified
            </span>
          </div>
          <div className="grid h-full grid-cols-1 content-start gap-3 p-4 sm:grid-cols-2">
            {contactItems.map((item, idx) => (
              <ContactDetailItem key={idx} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Location / Map Style Bento */}
      {isVisible('MyInfo Address') && personal.address && (
        <div className="group relative flex min-h-[220px] items-center overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 backdrop-blur-xl transition-all duration-500 hover:border-zinc-300 md:col-span-1 lg:col-span-1 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
          <div
            className="pointer-events-none absolute inset-0 bg-white opacity-50 mix-blend-overlay saturate-0 transition-all duration-1000 group-hover:saturate-100 dark:bg-zinc-950"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&fit=crop')",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-white via-white/60 to-transparent dark:from-zinc-950 dark:via-zinc-900/60" />

          <div className="relative z-10 flex h-full w-full flex-col justify-end p-6">
            <div className="mb-auto flex h-12 w-12 transform items-center justify-center rounded-xl border border-black/10 bg-zinc-900/10 text-zinc-900 shadow-lg backdrop-blur-md transition-transform group-hover:-translate-y-1 dark:border-white/10 dark:bg-zinc-100/10 dark:text-white">
              <MapPin size={20} />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h3
                  className="mb-1 text-lg leading-tight font-bold text-zinc-900 dark:text-zinc-100"
                  style={field('MyInfo Address').textColor ? { color: field('MyInfo Address').textColor } : undefined}
                >
                  {personal.address}
                </h3>
                <p className="text-xs font-semibold tracking-wider text-zinc-600 uppercase dark:text-zinc-400">
                  Headquarters
                </p>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-900 backdrop-blur-sm transition-colors group-hover:bg-zinc-900 group-hover:text-white hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 dark:hover:bg-zinc-700">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Network Grid */}
      {visibleSocials.length > 0 && (
        <div className="group flex flex-col justify-center rounded-3xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-xl transition-colors duration-500 hover:bg-white/80 md:col-span-1 lg:col-span-1 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">Network</h3>
          <div className="grid h-full grid-cols-2 gap-3">
            {visibleSocials.map((item, idx) => {
              const socialStyle = field(item.label)
              const iconColor = socialStyle.iconColor ?? socialStyle.textColor
              const socialInlineStyle =
                iconColor || socialStyle.backgroundColor
                  ? {
                      ...(iconColor ? { color: iconColor } : {}),
                      ...(socialStyle.backgroundColor
                        ? {
                            backgroundColor: socialStyle.backgroundColor,
                            borderColor: socialStyle.backgroundColor,
                          }
                        : {}),
                    }
                  : undefined
              const href = socialHref(item.label)
              return (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-square w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100/50 text-zinc-600 backdrop-blur-sm transition-all duration-300 hover:text-zinc-900 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:text-white"
                  style={socialInlineStyle}
                >
                  <item.icon size={22} fill={item.icon === Globe ? 'none' : 'currentColor'} className="opacity-90" />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
