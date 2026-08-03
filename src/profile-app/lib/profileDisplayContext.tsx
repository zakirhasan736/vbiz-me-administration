'use client'

import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import {
  getFieldConfig,
  getHomeMediaUrls,
  getPageColors,
  getPersonalValueForField,
  isFieldVisible,
  isFieldVisibleInProfile,
  resolveDisplaySettings,
} from '@/lib/vcardDisplaySettings'
import { createDefaultVCardSocial, getSocialHrefForDisplayLabel } from '@/lib/vcardSocial'
import type {
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardExtraField,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardPersonal,
  VCardServiceEntry,
  VCardSocial,
} from '@/types/vcard'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import type { MyCardActionButtons } from '@interfaces/api/myCard'
import React, { createContext, useContext, useMemo } from 'react'

export type ProfileDisplayContextValue = {
  settings: VCardDisplaySettings
  personal: VCardPersonal
  social: VCardSocial
  extraFields: VCardExtraField[]
  education: VCardEducationEntry[]
  experience: VCardExperienceEntry[]
  services: VCardServiceEntry[]
  generalPosts: VCardGeneralPost[]
  faqs: VCardFaqEntry[]
  design: ResolvedProfileDesign | null
  isVisible: (key: string) => boolean
  /** Nav Bar enable/disable — always respected (including live preview). */
  isNavVisible: (label: string) => boolean
  field: (key: string) => ReturnType<typeof getFieldConfig>
  personalValue: (fieldKey: string) => string
  socialHref: (displayLabel: string) => string
  pageColors: ReturnType<typeof getPageColors>
  homeMedia: ReturnType<typeof getHomeMediaUrls>
  embedded: boolean
  cardOwnerId?: string
  cardSlug?: string
  profileViews: number
  actionButtons?: MyCardActionButtons | null
}

const FALLBACK_PERSONAL: VCardPersonal = {
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
}

const defaultValue: ProfileDisplayContextValue = {
  settings: resolveDisplaySettings(),
  personal: FALLBACK_PERSONAL,
  social: createDefaultVCardSocial(),
  extraFields: [],
  education: [],
  experience: [],
  services: [],
  generalPosts: [],
  faqs: [],
  design: null,
  isVisible: () => true,
  isNavVisible: () => true,
  field: (key) => getFieldConfig(resolveDisplaySettings(), key),
  personalValue: () => '',
  socialHref: () => '',
  pageColors: getPageColors(resolveDisplaySettings()),
  homeMedia: getHomeMediaUrls(resolveDisplaySettings(), FALLBACK_PERSONAL),
  embedded: false,
  cardOwnerId: undefined,
  cardSlug: undefined,
  profileViews: 0,
  actionButtons: null,
}

const ProfileDisplayContext = createContext<ProfileDisplayContextValue>(defaultValue)

export function ProfileDisplayProvider({
  children,
  personal,
  displaySettings,
  social,
  extraFields,
  education,
  experience,
  services,
  generalPosts,
  faqs,
  design,
  /** Explicit avatar from card meta (merged into homeMedia.profileMedia). */
  avatarMediaUrl,
  /** Editor phone preview: show all sections regardless of Card Settings visibility. */
  embedded = false,
  cardOwnerId,
  cardSlug,
  profileViews = 0,
  actionButtons = null,
}: {
  children: React.ReactNode
  personal?: VCardPersonal
  displaySettings?: VCardDisplaySettings | null
  social?: VCardSocial | null
  extraFields?: VCardExtraField[]
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  services?: VCardServiceEntry[]
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  design?: ResolvedProfileDesign | null
  avatarMediaUrl?: string
  embedded?: boolean
  cardOwnerId?: string
  cardSlug?: string
  profileViews?: number
  actionButtons?: MyCardActionButtons | null
}) {
  const value = useMemo<ProfileDisplayContextValue>(() => {
    const settings = resolveDisplaySettings(displaySettings)
    const p = personal ?? FALLBACK_PERSONAL
    const soc = social ?? createDefaultVCardSocial()
    const extras = extraFields ?? []
    const edu = education ?? []
    const exp = experience ?? []
    const svc = services ?? []
    const posts = generalPosts ?? []
    const faqEntries = faqs ?? []
    return {
      settings,
      personal: p,
      social: soc,
      extraFields: extras,
      education: edu,
      experience: exp,
      services: svc,
      generalPosts: posts,
      faqs: faqEntries,
      design: design ?? null,
      isVisible: (key: string) => (embedded ? true : isFieldVisibleInProfile(settings, key)),
      isNavVisible: (label: string) => isFieldVisible(settings, label),
      field: (key: string) => getFieldConfig(settings, key),
      personalValue: (fieldKey: string) => getPersonalValueForField(p, fieldKey),
      socialHref: (label: string) => getSocialHrefForDisplayLabel(label, soc, p.website),
      pageColors: getPageColors(settings),
      homeMedia: (() => {
        const media = getHomeMediaUrls(settings, p)
        const avatar = media.profileMedia || avatarMediaUrl?.trim() || ''
        return avatar === media.profileMedia ? media : { ...media, profileMedia: avatar }
      })(),
      embedded,
      cardOwnerId,
      cardSlug,
      profileViews,
      actionButtons,
    }
  }, [
    personal,
    displaySettings,
    social,
    extraFields,
    education,
    experience,
    services,
    generalPosts,
    faqs,
    design,
    avatarMediaUrl,
    embedded,
    cardOwnerId,
    cardSlug,
    profileViews,
    actionButtons,
  ])

  return <ProfileDisplayContext.Provider value={value}>{children}</ProfileDisplayContext.Provider>
}

export function useProfileDisplay() {
  return useContext(ProfileDisplayContext)
}
