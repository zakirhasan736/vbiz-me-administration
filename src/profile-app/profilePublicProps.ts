import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import { buildProfilePath } from '@/lib/profileRoutes'
import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { resolveProfileDesignFromData } from '@/lib/resolvedProfileDesign'
import type { CardThemeConfig } from '@/lib/theme/cardThemeContract'
import { getDisplaySettingsFromVCard, getHomeMediaUrls, isFieldVisible } from '@/lib/vcardDisplaySettings'
import { normalizeFaqList } from '@/lib/vcardFaq'
import { normalizeGeneralPostList } from '@/lib/vcardGeneralPosts'
import { normalizeServiceList } from '@/lib/vcardServices'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import { DEFAULT_LIVE_AGENT_CARD, type LiveAgentCardData } from '@/profile-app/lib/liveAgentPrompt'
import { cleanProfileFieldValue } from '@/profile-app/lib/profileHomeData'
import type { DesignSettingsState } from '@/redux/features/designSettings/designSettings.slice'
import type {
  VCardData,
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardExtraField,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardPersonal,
  VCardRecord,
  VCardServiceEntry,
  VCardSocial,
} from '@/types/vcard'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import type { MyCardActionButtons } from '@interfaces/api/myCard'

export const DEFAULT_COVER = 'https://app.vbizme.com/storage/ecard/backgroundVideos/91/Untitled%20design-36.mp4'
/** Demo / fallback intro played in the avatar circle when no profile image is set. */
export const DEFAULT_INTRO_VIDEO = 'https://app.vbizme.com/storage/ecard/profileimages/91/mc%20vbizme.mp4'

/** Avatar circle: profile image/video first, otherwise intro video. */
export function resolveProfileAvatarSrc(
  avatarUrl?: string,
  introUrl?: string | null,
  fallbackIntro = DEFAULT_INTRO_VIDEO
): string {
  const avatar = avatarUrl?.trim()
  if (avatar) return avatar
  return introUrl?.trim() || fallbackIntro
}

export type VBizProfileAppProps = {
  explainerVideoUrl?: string | null
  cardOwnerId?: string
  ownerName?: string
  tagline?: string
  coverVideoUrl?: string
  avatarVideoUrl?: string
  liveAgentCardData?: LiveAgentCardData
  /** Pre-built on the server from `GET /profile-ai-data/{profile_id}`. */
  liveAgentSystemPrompt?: string
  design?: ResolvedProfileDesign
  personal?: VCardPersonal
  social?: VCardSocial
  extraFields?: VCardExtraField[]
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  services?: VCardServiceEntry[]
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  displaySettings?: VCardDisplaySettings
  /** Public slug used to build the share URL. */
  shareSlug?: string
  /** Slug for the public profile URL (`/v/{slug}`). */
  profileSlug?: string
  /** Active nav section (client state — not reflected in the URL). */
  sectionId?: string
  /** Called when the user picks a nav item (embedded preview). */
  onSectionChange?: (sectionId: string) => void
  /** Skip intro preloader and scope theme (editor preview). */
  embedded?: boolean
  /** Controlled theme for live preview chrome (optional). */
  previewTheme?: 'light' | 'dark'
  onPreviewThemeChange?: (theme: 'light' | 'dark') => void
  profileViews?: number
  actionButtons?: MyCardActionButtons | null
  /** Server-prefetched navbar catalog (`GET /post-types?profile_id=`). */
  initialNavBarLinks?: NavBarLinksData | null
  /** Dynamic global theme (Primary/Secondary/Accent + button/social appearance). Optional. */
  themeConfig?: CardThemeConfig | null
  /** True when theme comes from settings API (not template defaults). */
  themeFromApi?: boolean
}

export function buildProfileShareUrl(slug: string): string {
  const trimmed = slug.trim()
  if (!trimmed) return ''
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${buildProfilePath(trimmed)}`
  }
  return `https://vbiz.me/v/${trimmed}`
}

export function vCardDataToProfileProps(
  data: VCardData,
  designSettings: DesignSettingsState,
  meta?: { id?: string; avatarImageUrl?: string }
): VBizProfileAppProps {
  const slug = data.slug.trim()
  const display = getDisplaySettingsFromVCard(data)
  const homeMedia = getHomeMediaUrls(display, data.personal)
  const introUrl = homeMedia.introVideo || data.personal.explainerVideoUrl?.trim() || undefined
  const coverUrl = homeMedia.bgMedia || DEFAULT_COVER
  const avatarOnly = homeMedia.profileMedia || meta?.avatarImageUrl?.trim() || undefined

  const showName = isFieldVisible(display, 'MyInfo section Name')
  const showTagline =
    isFieldVisible(display, 'MyInfo Profession') ||
    isFieldVisible(display, 'MyInfo Designation') ||
    isFieldVisible(display, 'MyInfo Company')

  const ownerName = showName ? data.personal.fullName || 'Your Name' : ''
  const taglineParts: string[] = []
  if (showTagline) {
    if (isFieldVisible(display, 'MyInfo Designation') && data.personal.designation) {
      taglineParts.push(cleanProfileFieldValue(data.personal.designation))
    }
    if (isFieldVisible(display, 'MyInfo Profession') && data.personal.profession) {
      taglineParts.push(data.personal.profession)
    }
    if (isFieldVisible(display, 'MyInfo Company') && data.personal.company) {
      taglineParts.push(data.personal.company)
    }
  }
  const tagline =
    taglineParts.join(' · ') ||
    (showTagline && data.personal.about?.trim()) ||
    (showTagline ? 'Your digital introduction' : '')

  return {
    explainerVideoUrl: introUrl,
    cardOwnerId: meta?.id ?? 'preview',
    ownerName,
    tagline,
    coverVideoUrl: coverUrl,
    avatarVideoUrl: avatarOnly,
    design: resolveProfileDesignFromData(data, designSettings),
    personal: data.personal,
    social: data.social ?? createDefaultVCardSocial(),
    extraFields: data.extraFields ?? [],
    education: data.education ?? [],
    experience: data.experience ?? [],
    services: normalizeServiceList(data.services),
    generalPosts: normalizeGeneralPostList(data.generalPosts),
    faqs: normalizeFaqList(data.faqs),
    displaySettings: display,
    shareSlug: slug || undefined,
    themeConfig: data.themeConfig ?? null,
  }
}

export function vCardRecordToProfileProps(
  record: VCardRecord,
  designSettings: DesignSettingsState,
  actionButtons?: MyCardActionButtons | null
): VBizProfileAppProps {
  return {
    ...vCardDataToProfileProps(record, designSettings, {
      id: record.id,
      avatarImageUrl: record.avatarImageUrl,
    }),
    profileViews: record.views,
    actionButtons: actionButtons ?? null,
  }
}

export const DEMO_PROFILE_PROPS: VBizProfileAppProps = {
  cardOwnerId: '91',
  ownerName: 'Michaelangelo C.',
  tagline: 'Visionary founder and growth strategist scaling vBiz ecosystem globally.',
  explainerVideoUrl: DEFAULT_INTRO_VIDEO,
  coverVideoUrl: DEFAULT_COVER,
  liveAgentCardData: DEFAULT_LIVE_AGENT_CARD,
}
