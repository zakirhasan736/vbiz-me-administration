'use client'

import { encodeMediaUrl, isVideoUrl } from '@/lib/mediaUrl'
import { displayIconChromeStyle, displaySocialChromeStyle, mergeDisplayFieldConfigs } from '@/lib/vcardDisplaySettings'
import { CustomVideoPlayer } from '@/profile-app/components/CustomVideoPlayer'
import { GameIdsRail } from '@/profile-app/components/GameIdsRail'
import { IconHoverTooltip } from '@/profile-app/components/IconHoverTooltip'
import { SelectedLanguageMark } from '@/profile-app/components/SelectedLanguageMark'
import { RumbleIcon, WhatsAppIcon } from '@/profile-app/components/socialBrandIcons'
import { isProfileActionButtonEnabled } from '@/profile-app/lib/profileActionButtons'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { openVbizmeCrm, openVbizmeLogin } from '@/profile-app/lib/profileExternalLinks'
import {
  cleanProfileFieldValue,
  formatProfileViewCount,
  resolveGlobalProfession,
} from '@/profile-app/lib/profileHomeData'
import {
  filterSocialItemsWithLinks,
  onTrackedSocialClick,
  resolveSocialLinkHref,
} from '@/profile-app/lib/profileSocialLinks'
import { resolveProfileAvatarSrc } from '@/profile-app/profilePublicProps'
import { cn } from '@/utils/cn'
import {
  Bell,
  Eye,
  Facebook,
  FileEdit,
  Globe,
  Instagram,
  Linkedin,
  Share2,
  Star,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useMemo, type ReactElement } from 'react'

const HOME_ICON_SIZE = 22

const XIcon = ({ size = HOME_ICON_SIZE }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const TikTokIcon = ({ size = HOME_ICON_SIZE }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.14-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.61 1.05-5.26 3.23-6.6 1.46-.91 3.25-1.29 4.96-1v4.21c-.81-.19-1.7-.17-2.48.24-.95.49-1.64 1.41-1.79 2.49-.16 1.13.25 2.31 1.05 3.12.8.84 2.05 1.25 3.21 1.12 1.58-.16 2.87-1.42 3.15-3 .06-.41.07-.82.06-1.24-.03-6.09-.03-12.18-.03-18.27Z" />
  </svg>
)

type V2SocialItem = {
  label: string
  icon: LucideIcon | ((props: { size?: number }) => ReactElement)
  isSvg?: boolean
}

const V2_SOCIAL_ITEMS: V2SocialItem[] = [
  { label: 'Twitter', icon: XIcon, isSvg: true },
  { label: 'FaceBook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'Whatsapp', icon: WhatsAppIcon, isSvg: true },
  { label: 'TikTok', icon: TikTokIcon, isSvg: true },
  { label: 'Youtube', icon: Youtube },
  { label: 'Pinterest', icon: Globe },
  { label: 'Rumble', icon: RumbleIcon, isSvg: true },
  { label: 'Truth', icon: Globe },
  { label: 'Website', icon: Globe },
]

const V2_SOCIAL_TOOLTIP: Record<string, string> = {
  Twitter: 'X',
  FaceBook: 'Facebook',
  Instagram: 'Instagram',
  LinkedIn: 'LinkedIn',
  Whatsapp: 'WhatsApp',
  TikTok: 'TikTok',
  Youtube: 'YouTube',
  Pinterest: 'Pinterest',
  Rumble: 'Rumble',
  Truth: 'Truth Social',
  Website: 'Website',
}

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
  const { personal, social, isVisible, field, socialHref, profileViews, actionButtons, cardOwnerId, cardSlug } =
    useProfileDisplay()
  const avatarDisplaySrc = useMemo(
    () => resolveProfileAvatarSrc(avatarVideoUrl, explainerVideoUrl),
    [avatarVideoUrl, explainerVideoUrl]
  )
  const avatarIsVideo = Boolean(avatarDisplaySrc && isVideoUrl(avatarDisplaySrc))
  const encodedAvatarSrc = avatarDisplaySrc ? encodeMediaUrl(avatarDisplaySrc) : ''

  const displayName = ownerName?.trim() || personal.fullName?.trim() || ''
  const rawProfession = tagline?.trim() || resolveGlobalProfession(personal, isVisible)
  const designation = rawProfession ? cleanProfileFieldValue(rawProfession) : ''

  const showShare = isProfileActionButtonEnabled('share', actionButtons, isVisible)
  const showCrm = isVisible('CRM')
  const showViewCounter = isProfileActionButtonEnabled('view_counter', actionButtons, isVisible)
  const showLanguage = isProfileActionButtonEnabled('language', actionButtons, isVisible)
  const viewCounterCount = actionButtons?.view_counter?.count ?? profileViews
  const shareChrome = displayIconChromeStyle(mergeDisplayFieldConfigs(field('Share'), field('Share Btn')))
  const crmChrome = displayIconChromeStyle(field('CRM'))
  const languageChrome = displayIconChromeStyle(field('Language'))
  const websiteChrome = displayIconChromeStyle(field('Website'))
  const viewsChrome = displayIconChromeStyle(field('Vcard View Counter'))

  const websiteHref = useMemo(() => resolveSocialLinkHref('Website', socialHref).trim(), [socialHref])
  const showWebsite = Boolean(websiteHref) && isVisible('Website')

  const visibleSocials = useMemo(
    () =>
      filterSocialItemsWithLinks(V2_SOCIAL_ITEMS, socialHref, personal.whatsapp, isVisible).filter(
        (item) => item.label !== 'Website'
      ),
    [socialHref, personal.whatsapp, isVisible]
  )

  const renderSocialIcon = (item: V2SocialItem) => {
    if (item.isSvg) {
      const Icon = item.icon as (props: { size?: number }) => ReactElement
      return <Icon size={HOME_ICON_SIZE} />
    }
    const Icon = item.icon as LucideIcon
    return <Icon size={HOME_ICON_SIZE} />
  }

  const socialInlineStyle = (label: string) => displaySocialChromeStyle(field(label))

  const socialBtnClass =
    'vbiz-social flex h-8 w-8 items-center justify-center rounded-full transition-colors md:h-10 md:w-10'
  const desktopSocialBtnClass = 'vbiz-social flex h-10 w-10 items-center justify-center rounded-full transition-colors'

  const nameStyle = headerTextColor
    ? { color: headerTextColor }
    : field('MyInfo section Name').textColor
      ? { color: field('MyInfo section Name').textColor }
      : undefined

  const professionStyle = field('MyInfo Profession').textColor
    ? { color: field('MyInfo Profession').textColor }
    : field('MyInfo Designation').textColor
      ? { color: field('MyInfo Designation').textColor }
      : undefined

  const hasGameIds = Boolean(social.games && Object.values(social.games).some((v) => v?.trim()))
  const showSocialRail = visibleSocials.length > 0 || hasGameIds

  return (
    <header
      className={`relative mb-4 flex w-full flex-col items-center gap-6 px-12 md:flex-row md:items-start md:justify-center md:px-16 lg:gap-10 lg:px-20 ${embedded ? 'mb-8' : 'sm:mb-10'}`}
    >
      {showSocialRail && (
        <div className="absolute top-0 left-0 z-30 flex flex-col gap-2 rounded-full border border-zinc-200 bg-white/50 p-1.5 shadow-sm backdrop-blur-md md:hidden dark:border-zinc-700/50 dark:bg-zinc-900/50">
          {visibleSocials.map((socialItem) => {
            const href = resolveSocialLinkHref(socialItem.label, socialHref, personal.whatsapp)
            const tip = V2_SOCIAL_TOOLTIP[socialItem.label] ?? socialItem.label
            return (
              <IconHoverTooltip key={socialItem.label} label={tip} placement="right">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackedSocialClick(socialItem.label, cardOwnerId, cardSlug)}
                  className={socialBtnClass}
                  aria-label={tip}
                  style={socialInlineStyle(socialItem.label)}
                >
                  {renderSocialIcon(socialItem)}
                </a>
              </IconHoverTooltip>
            )
          })}
          <GameIdsRail games={social.games} buttonClassName={socialBtnClass} tooltipPlacement="right" />
        </div>
      )}

      <div className="group relative shrink-0">
        <div
          className={`relative z-10 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 shadow-xl transition-transform duration-500 group-hover:scale-[1.02] dark:border-zinc-800 ${embedded ? 'mt-2 h-48 w-40' : 'h-60 w-48 md:h-64 md:w-56'}`}
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
            style={professionStyle}
          >
            {designation}
          </p>
        ) : null}

        {showSocialRail && (
          <div
            className={cn('mb-6 hidden w-full max-w-md flex-col items-start gap-2 md:flex', embedded ? 'mb-2' : 'mb-6')}
          >
            {visibleSocials.length > 0 && (
              <div className="flex max-w-full flex-wrap items-center justify-start gap-2">
                {visibleSocials.map((socialItem) => {
                  const href = resolveSocialLinkHref(socialItem.label, socialHref, personal.whatsapp)
                  const tip = V2_SOCIAL_TOOLTIP[socialItem.label] ?? socialItem.label
                  return (
                    <IconHoverTooltip key={socialItem.label} label={tip}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrackedSocialClick(socialItem.label, cardOwnerId, cardSlug)}
                        className={desktopSocialBtnClass}
                        aria-label={tip}
                        style={socialInlineStyle(socialItem.label)}
                      >
                        {renderSocialIcon(socialItem)}
                      </a>
                    </IconHoverTooltip>
                  )
                })}
              </div>
            )}
            <GameIdsRail
              games={social.games}
              buttonClassName={desktopSocialBtnClass}
              tooltipPlacement="top"
              wrapperClassName="flex max-w-full flex-wrap items-center justify-start gap-2"
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          'absolute top-0 right-0 z-30 flex flex-col gap-2 rounded-full border border-zinc-200 bg-white/50 p-1.5 shadow-sm backdrop-blur-md md:gap-4 md:p-2 dark:border-zinc-700/50 dark:bg-zinc-900/50',
          embedded ? 'top-4 right-1' : 'top-0 right-0'
        )}
      >
        {showViewCounter && (
          <IconHoverTooltip label="Total views" placement="left">
            <button
              type="button"
              onClick={() => openVbizmeLogin()}
              className="vbiz-icon-btn group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              style={viewsChrome}
              aria-label="Total views"
            >
              <Eye size={HOME_ICON_SIZE} />
              <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1 py-0.5 text-[8px] font-bold text-white md:-top-2 md:-right-2 md:px-1 md:text-[9px]">
                {formatProfileViewCount(viewCounterCount)}
              </span>
            </button>
          </IconHoverTooltip>
        )}
        {showWebsite && (
          <IconHoverTooltip label="Website" placement="left">
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="vbiz-icon-btn flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              style={websiteChrome}
              aria-label="Website"
            >
              <Globe size={HOME_ICON_SIZE} />
            </a>
          </IconHoverTooltip>
        )}
        {showLanguage && (
          <IconHoverTooltip label="Language" placement="left">
            <button
              type="button"
              onClick={onLanguage}
              className="vbiz-icon-btn flex h-auto min-h-8 w-auto min-w-8 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white px-1 py-1 text-zinc-400 transition-colors hover:bg-zinc-50 md:min-h-10 md:min-w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              style={languageChrome}
              aria-label="Language"
            >
              <SelectedLanguageMark
                showName={false}
                flagWidth={48}
                flagClassName="h-5 w-7 rounded-[3px] object-cover shadow-sm ring-1 ring-black/10 md:h-6 md:w-8"
              />
            </button>
          </IconHoverTooltip>
        )}
        {showCrm && (
          <button
            type="button"
            onClick={() => openVbizmeCrm()}
            className="vbiz-icon-btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-[9px] font-black tracking-wide text-zinc-600 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 md:text-[10px] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            style={crmChrome}
            title="CRM"
            aria-label="Open CRM"
          >
            CRM
          </button>
        )}
        {showShare && (
          <IconHoverTooltip label="Share" placement="left">
            <button
              type="button"
              onClick={onShare}
              className="vbiz-icon-btn flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              style={shareChrome}
              aria-label="Share"
            >
              <Share2 size={HOME_ICON_SIZE} />
            </button>
          </IconHoverTooltip>
        )}
        <IconHoverTooltip label="Notifications" placement="left">
          <button
            type="button"
            onClick={onNotificationSettings}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Notifications"
          >
            <Bell size={HOME_ICON_SIZE} className="text-[#eab308]" />
            <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500 md:top-1 md:right-1" />
          </button>
        </IconHoverTooltip>
        <IconHoverTooltip label="Notes" placement="left">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 md:h-10 md:w-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Notes"
            onClick={() => {
              onOpenNotepad?.()
              window.dispatchEvent(new CustomEvent('openNotepadAction'))
            }}
          >
            <FileEdit size={HOME_ICON_SIZE} className="text-[#eab308]" />
          </button>
        </IconHoverTooltip>
      </div>
    </header>
  )
}
