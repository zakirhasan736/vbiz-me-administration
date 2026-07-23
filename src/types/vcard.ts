import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'

export type VCardTheme = {
  primaryColor: string
  accentColor: string
  darkMode: boolean
  /** Matches Settings → Appearance typography id when synced */
  fontFamily?: string
}

/** Per-vCard template & layout snapshot (defaults copied from account profile settings on create). */
export type ButtonShadowId = 'none' | 'soft' | 'strong' | 'hard'

export type VCardAppearance = {
  profileTemplate: ProfileTemplateId
  layoutStyle: string
  buttonStyle: string
  cornerStyle: string
  buttonShadow?: ButtonShadowId
}

export type VCardPersonal = {
  fullName: string
  email: string
  dob: string
  gender: string
  relationship: string
  profession: string
  designation: string
  company: string
  phone: string
  whatsapp: string
  address: string
  /** Public website URL (contact card + MyInfo Website setting) */
  website?: string
  about: string
  /** Shown on the public profile preloader (Personal → Explainer Video) */
  explainerVideoUrl?: string
}

export type VCardCustomSocialLink = {
  id: string
  name: string
  url: string
}

/** Personal → Social & Games (handles, custom links, game IDs). */
export type VCardSocial = {
  handles: Record<string, string>
  customLinks: VCardCustomSocialLink[]
  games: Record<string, string>
}

/** Personal → Extra Fields (custom My Info rows). */
export type VCardExtraField = {
  id: string
  icon: string
  name: string
  value: string
}

/** Back office → Education tab entries (shown on profile Resume section). */
export type VCardEducationEntry = {
  id: string
  institute: string
  degree: string
  fromDate: string
  toDate: string
  tillNow: boolean
}

/** Back office → Experience tab entries (shown on profile Work Experience section). */
export type VCardExperienceEntry = {
  id: string
  company: string
  jobTitle: string
  description: string
  fromDate: string
  toDate: string
  tillNow: boolean
}

/** Back office → Services tab entries (shown on profile Services section). */
export type VCardServiceEntry = {
  id: string
  type: string
  title: string
  description: string
  url: string
  featuredImage: string
  active: boolean
}

/** Back office → Blog tab posts (shown on profile Blog section, v1 and v2). */
export type VCardGeneralPost = {
  id: string
  category: string
  title: string
  description: string
  customUrl: string
  featuredImage: string
  date: string
  active: boolean
}

/** Back office → FAQ tab entries (shown on profile FAQ section, v1 and v2). */
export type VCardFaqEntry = {
  id: string
  question: string
  answer: string
  active: boolean
}

export type VCardData = {
  slug: string
  isPublic: boolean
  personal: VCardPersonal
  theme: VCardTheme
  /** Template, layout, and button styles for this card (from account defaults on create). */
  appearance?: VCardAppearance
  services?: VCardServiceEntry[]
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  portfolio: unknown[]
  /** @deprecated Legacy field; use `social` */
  socials: unknown[]
  social?: VCardSocial
  extraFields?: VCardExtraField[]
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  /** Card Settings tab: visibility, colors, and overrides per UI element */
  displaySettings?: VCardDisplaySettings
}

export type VCardListMeta = {
  views: number
  saves: number
  /** Dashboard card image (Media & Profile) */
  avatarImageUrl: string
  isActive: boolean
}

export type VCardRecord = VCardData &
  VCardListMeta & {
    id: string
    createdAt: string
    updatedAt: string
  }

export function createDefaultVCardData(overrides?: Partial<VCardData>): VCardData {
  const base: VCardData = {
    slug: '',
    isPublic: true,
    personal: {
      fullName: '',
      email: '',
      dob: '',
      gender: 'Male',
      relationship: 'Single',
      profession: '',
      designation: '',
      company: '',
      phone: '',
      whatsapp: '',
      address: '',
      website: '',
      about: '',
      explainerVideoUrl: '',
    },
    theme: {
      primaryColor: '#6366f1',
      accentColor: '#f43f5e',
      darkMode: true,
      fontFamily: 'inter',
    },
    appearance: { ...DEFAULT_VCARD_APPEARANCE },
    services: [],
    generalPosts: [],
    faqs: [],
    portfolio: [],
    socials: [],
    social: { handles: {}, customLinks: [], games: {} },
    extraFields: [],
    education: [],
    experience: [],
  }
  if (!overrides) return base
  return {
    ...base,
    ...overrides,
    personal: { ...base.personal, ...overrides.personal },
    theme: { ...base.theme, ...overrides.theme },
    appearance: overrides.appearance ? { ...DEFAULT_VCARD_APPEARANCE, ...overrides.appearance } : base.appearance,
    social: {
      handles: { ...base.social!.handles, ...overrides.social?.handles },
      customLinks: overrides.social?.customLinks ?? base.social!.customLinks,
      games: { ...base.social!.games, ...overrides.social?.games },
    },
    extraFields: overrides.extraFields ?? base.extraFields,
    education: overrides.education ?? base.education,
    experience: overrides.experience ?? base.experience,
    services: overrides.services ?? base.services,
    generalPosts: overrides.generalPosts ?? base.generalPosts,
    faqs: overrides.faqs ?? base.faqs,
    displaySettings: overrides.displaySettings,
  }
}

export const DEFAULT_VCARD_APPEARANCE: VCardAppearance = {
  profileTemplate: 'v2',
  layoutStyle: 'classic',
  buttonStyle: 'solid',
  cornerStyle: 'round',
}
