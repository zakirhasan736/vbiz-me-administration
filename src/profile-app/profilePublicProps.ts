import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { resolveProfileDesignFromData } from '@/lib/resolvedProfileDesign'
import { getDisplaySettingsFromVCard, getHomeMediaUrls, isFieldVisible } from '@/lib/vcardDisplaySettings'
import { normalizeFaqList } from '@/lib/vcardFaq'
import { normalizeGeneralPostList } from '@/lib/vcardGeneralPosts'
import { normalizeServiceList } from '@/lib/vcardServices'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import { DEFAULT_LIVE_AGENT_CARD, type LiveAgentCardData } from '@/profile-app/lib/liveAgentPrompt'
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
import type { ReactNode } from 'react'

const DEFAULT_COVER = 'https://app.vbizme.com/storage/ecard/backgroundVideos/91/Untitled%20design-36.mp4'
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
  /** Active nav section (from URL or parent). */
  sectionId?: string
  /** Slug for route-based nav links (`/v/{slug}/{section}`). */
  profileSlug?: string
  /** Embedded preview: update section without changing the browser URL. */
  onSectionChange?: (sectionId: string) => void
  /** Skip intro preloader and scope theme (editor preview). */
  embedded?: boolean
  /** Controlled theme for live preview chrome (optional). */
  previewTheme?: 'light' | 'dark'
  onPreviewThemeChange?: (theme: 'light' | 'dark') => void
  /** When set (public route layout), only this slot updates on section navigation. */
  children?: ReactNode
}

export function buildProfileShareUrl(slug: string): string {
  const trimmed = slug.trim()
  if (!trimmed) return ''
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/v/${trimmed}`
  }
  return `https://vbiz.me/${trimmed}`
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
      taglineParts.push(data.personal.designation)
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
    liveAgentCardData: {
      ownerName: data.personal.fullName || DEFAULT_LIVE_AGENT_CARD.ownerName,
      title: data.personal.designation || data.personal.profession || DEFAULT_LIVE_AGENT_CARD.title,
      company: data.personal.company || DEFAULT_LIVE_AGENT_CARD.company,
      email: data.personal.email || DEFAULT_LIVE_AGENT_CARD.email,
      phone: data.personal.phone || DEFAULT_LIVE_AGENT_CARD.phone,
      website: slug ? `https://vbiz.me/${slug}` : DEFAULT_LIVE_AGENT_CARD.website,
      location: data.personal.address || DEFAULT_LIVE_AGENT_CARD.location,
    },
  }
}

export function vCardRecordToProfileProps(
  record: VCardRecord,
  designSettings: DesignSettingsState
): VBizProfileAppProps {
  return vCardDataToProfileProps(record, designSettings, {
    id: record.id,
    avatarImageUrl: record.avatarImageUrl,
  })
}

export const DEMO_PROFILE_PROPS: VBizProfileAppProps = {
  cardOwnerId: '91',
  ownerName: 'Michaelangelo C.',
  tagline: 'Visionary founder and growth strategist scaling vBiz ecosystem globally.',
  explainerVideoUrl: DEFAULT_INTRO_VIDEO,
  coverVideoUrl: DEFAULT_COVER,
  liveAgentCardData: DEFAULT_LIVE_AGENT_CARD,
}
