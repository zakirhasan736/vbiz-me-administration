'use client'

import { encodeMediaUrl, isVideoUrl } from '@/lib/mediaUrl'
import { CustomVideoPlayer } from '@/profile-app/components/CustomVideoPlayer'
import { isProfileActionButtonEnabled } from '@/profile-app/lib/profileActionButtons'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { openVbizmeLogin } from '@/profile-app/lib/profileExternalLinks'
import { cleanProfileFieldValue, formatProfileViewCount } from '@/profile-app/lib/profileHomeData'
import { filterSocialItemsWithLinks, resolveSocialLinkHref } from '@/profile-app/lib/profileSocialLinks'
import { resolveProfileAvatarSrc } from '@/profile-app/profilePublicProps'
import {
  Bell,
  Eye,
  Facebook,
  FileEdit,
  Globe,
  Instagram,
  Languages,
  Linkedin,
  MessageCircle,
  Share2,
  Star,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useMemo, type ReactElement } from 'react'

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden className="md:h-4 md:w-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden className="md:h-4 md:w-4">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.14-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.61 1.05-5.26 3.23-6.6 1.46-.91 3.25-1.29 4.96-1v4.21c-.81-.19-1.7-.17-2.48.24-.95.49-1.64 1.41-1.79 2.49-.16 1.13.25 2.31 1.05 3.12.8.84 2.05 1.25 3.21 1.12 1.58-.16 2.87-1.42 3.15-3 .06-.41.07-.82.06-1.24-.03-6.09-.03-12.18-.03-18.27Z" />
  </svg>
)

type V2SocialItem = {
  label: string
  icon: LucideIcon | (() => ReactElement)
  isSvg?: boolean
}

const V2_SOCIAL_ITEMS: V2SocialItem[] = [
  { label: 'Twitter', icon: XIcon, isSvg: true },
  { label: 'FaceBook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'Whatsapp', icon: MessageCircle },
  { label: 'TikTok', icon: TikTokIcon, isSvg: true },
  { label: 'Youtube', icon: Youtube },
  { label: 'Pinterest', icon: Globe },
  { label: 'Rumble', icon: Globe },
  { label: 'Truth', icon: Globe },
  { label: 'Website', icon: Globe },
]

type ProfileHeaderV2Props = {
  avatarVideoUrl?: string
  explainerVideoUrl?: string
  ownerName?: string
  tagline?: string
  headerTextColor?: string
  onShare?: () => void
  onNotificationSettings?: () => void
  onOpenNotepad?: () => void
  onLanguage?: () => void
  embedded?: boolean
}

export function ProfileHeaderV2({
  avatarVideoUrl,
  explainerVideoUrl,
  ownerName,
  tagline,
  headerTextColor,
  onShare,
  onNotificationSettings,
  onOpenNotepad,
  onLanguage,
  embedded,
}: ProfileHeaderV2Props) {
  const { personal, isVisible, field, socialHref, profileViews, actionButtons } = useProfileDisplay()

  const avatarDisplaySrc = useMemo(
    () => resolveProfileAvatarSrc(avatarVideoUrl, explainerVideoUrl),
    [avatarVideoUrl, explainerVideoUrl]
  )
  const avatarIsVideo = Boolean(avatarDisplaySrc && isVideoUrl(avatarDisplaySrc))
  const encodedAvatarSrc = avatarDisplaySrc ? encodeMediaUrl(avatarDisplaySrc) : ''

  const displayName = ownerName?.trim() || personal.fullName?.trim() || ''
  const rawDesignation =
    tagline?.trim() || (isVisible('MyInfo Designation') && personal.designation?.trim() ? personal.designation : '')
  const designation = rawDesignation ? cleanProfileFieldValue(rawDesignation) : ''

  const showShare = isProfileActionButtonEnabled('share', actionButtons, isVisible)
  const showViewCounter = isProfileActionButtonEnabled('view_counter', actionButtons, isVisible)
  const showLanguage = isProfileActionButtonEnabled('language', actionButtons, isVisible)
  const viewCounterCount = actionButtons?.view_counter?.count ?? profileViews

  const websiteHref = useMemo(() => resolveSocialLinkHref('Website', socialHref).trim(), [socialHref])

  const visibleSocials = useMemo(
    () =>
      filterSocialItemsWithLinks(V2_SOCIAL_ITEMS, socialHref, personal.whatsapp).filter(
        (item) => item.label !== 'Website'
      ),
    [socialHref, personal.whatsapp]
  )

  const renderSocialIcon = (item: V2SocialItem) => {
    if (item.isSvg) {
      const Icon = item.icon as () => ReactElement
      return <Icon />
    }
    const Icon = item.icon as LucideIcon
    return <Icon size={14} className="md:h-4 md:w-4" />
  }

  const nameStyle = headerTextColor
    ? { color: headerTextColor }
    : field('MyInfo section Name').textColor
      ? { color: field('MyInfo section Name').textColor }
      : undefined

  const designationStyle = field('MyInfo Designation').textColor
    ? { color: field('MyInfo Designation').textColor }
    : undefined

  return (
    <header
      className={`relative mb-4 flex w-full flex-col items-center gap-6 px-12 md:flex-row md:items-start md:justify-center md:px-16 lg:gap-10 lg:px-20 ${embedded ? 'mb-8' : 'sm:mb-10'}`}
    >
      {visibleSocials.length > 0 && (
        <div className="absolute top-0 left-0 z-30 flex flex-col gap-2 rounded-full border border-zinc-200 bg-white/50 p-1.5 shadow-sm backdrop-blur-md md:hidden dark:border-zinc-700/50 dark:bg-zinc-900/50">
          {visibleSocials.map((social) => {
            const href = resolveSocialLinkHref(social.label, socialHref, personal.whatsapp)
            return (
              <a
                key={social.label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="vbiz-social flex h-8 w-8 items-center justify-center rounded-full transition-colors md:h-10 md:w-10"
                aria-label={social.label}
              >
                {renderSocialIcon(social)}
              </a>
            )
          })}
        </div>
      )}

      <div className="group relative shrink-0">
        <div
          className={`relative z-10 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 shadow-xl transition-transform duration-500 group-hover:scale-[1.02] dark:border-zinc-800 ${embedded ? 'h-48 w-40' : 'h-60 w-48 md:h-64 md:w-56'}`}
        >
          {avatarIsVideo ? (
            <CustomVideoPlayer
              src={encodedAvatarSrc}
              imageAlt={displayName ? `${displayName} avatar` : 'Avatar'}
              controlsMode="owner"
              showSeekBar={false}
              className="h-full w-full"
            />
          ) : encodedAvatarSrc ? (
            <Image
              width={560}
              height={640}
              src={encodedAvatarSrc}
              alt={displayName ? `${displayName} avatar` : 'Avatar'}
              className="h-full w-full object-cover"
            />
          ) : null}

          <div className="pointer-events-none absolute top-3 right-3 z-30 flex items-center gap-1 rounded-md border border-[#eab308]/30 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-bold text-[#eab308] backdrop-blur-md">
            <Star size={10} fill="currentColor" /> PREMIUM
          </div>
        </div>
      </div>

      <div className="mt-2 flex w-full flex-1 flex-col items-center text-center md:mt-4 md:items-start md:text-left">
        {displayName ? (
          <h1
            className={`mb-0 leading-tight font-bold tracking-tight text-zinc-900 [text-shadow:0_1px_3px_rgba(255,255,255,0.85),0_0_22px_rgba(255,255,255,0.6)] sm:mb-2 dark:text-zinc-100 dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_0_22px_rgba(0,0,0,0.7)] ${embedded ? 'text-2xl' : 'text-3xl md:text-5xl'}`}
            style={nameStyle}
          >
            {displayName}
          </h1>
        ) : null}
        {designation ? (
          <p
            className="mb-0 text-base font-bold text-[#d97706] [text-shadow:0_1px_2px_rgba(255,255,255,0.8)] sm:mb-4 md:text-lg dark:text-[#f59e0b] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            style={designationStyle}
          >
            {designation}
          </p>
        ) : null}

        {visibleSocials.length > 0 && (
          <div className="mb-6 hidden flex-wrap items-center justify-start gap-2 md:flex">
            {visibleSocials.map((social) => {
              const href = resolveSocialLinkHref(social.label, socialHref, personal.whatsapp)
              return (
                <a
                  key={social.label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vbiz-social flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                  aria-label={social.label}
                >
                  {itemIcon(social)}
                </a>
              )
            })}
          </div>
        )}
      </div>

      <div className="absolute top-0 right-0 z-30 flex flex-col gap-2 rounded-full border border-zinc-200 bg-white/50 p-1.5 shadow-sm backdrop-blur-md md:gap-4 md:p-2 dark:border-zinc-700/50 dark:bg-zinc-900/50">
        {showViewCounter && (
          <button
            type="button"
            onClick={() => openVbizmeLogin()}
            className="group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="View analytics"
          >
            <Eye size={14} className="text-[#eab308] md:h-4 md:w-4" />
            <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1 py-0.5 text-[8px] font-bold text-white md:-top-2 md:-right-2 md:px-1 md:text-[9px]">
              {formatProfileViewCount(viewCounterCount)}
            </span>
          </button>
        )}
        {websiteHref && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Visit website"
          >
            <Globe size={14} className="text-[#eab308] md:h-4 md:w-4" />
          </a>
        )}
        {showLanguage && (
          <button
            type="button"
            onClick={onLanguage}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Language"
          >
            <Languages size={14} className="text-[#eab308] md:h-4 md:w-4" />
          </button>
        )}
        {showShare && (
          <button
            type="button"
            onClick={onShare}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Share profile"
          >
            <Share2 size={14} className="text-[#eab308] md:h-4 md:w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onNotificationSettings}
          className="relative flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          aria-label="Notification settings"
        >
          <Bell size={14} className="text-[#eab308] md:h-4 md:w-4" />
          <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500 md:top-1 md:right-1" />
        </button>
        <button
          type="button"
          onClick={onOpenNotepad}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          aria-label="Open notepad"
        >
          <FileEdit size={14} className="text-[#eab308] md:h-4 md:w-4" />
        </button>
      </div>
    </header>
  )
}

function itemIcon(item: V2SocialItem) {
  if (item.isSvg) {
    const Icon = item.icon as () => ReactElement
    return <Icon />
  }
  const Icon = item.icon as LucideIcon
  return <Icon size={16} />
}
