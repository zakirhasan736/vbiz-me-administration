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
import { DEFAULT_VCARD_MY_INFO } from '@/lib/vcardMyInfo'
import { createDefaultVCardSocial, getSocialHrefForDisplayLabel } from '@/lib/vcardSocial'
import type {
  VCardCustomTab,
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardExtraField,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardMyInfo,
  VCardPersonal,
  VCardServiceEntry,
  VCardSocial,
  VCardTabLabelOverrides,
} from '@/types/vcard'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import type { MyCardActionButtons } from '@interfaces/api/myCard'
import React, { createContext, useContext, useMemo } from 'react'

export type ProfileDisplayContextValue = {
  settings: VCardDisplaySettings
  personal: VCardPersonal
  social: VCardSocial
  extraFields: VCardExtraField[]
  myInfo: VCardMyInfo
  education: VCardEducationEntry[]
  experience: VCardExperienceEntry[]
  services: VCardServiceEntry[]
  generalPosts: VCardGeneralPost[]
  faqs: VCardFaqEntry[]
  customTabs: VCardCustomTab[]
  tabLabelOverrides: VCardTabLabelOverrides
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
  /** False while an embedded preview is closed or minimized (background media pauses). */
  previewActive: boolean
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
  zipCode: '',
  website: '',
  about: '',
}

const defaultValue: ProfileDisplayContextValue = {
  settings: resolveDisplaySettings(),
  personal: FALLBACK_PERSONAL,
  social: createDefaultVCardSocial(),
  extraFields: [],
  myInfo: DEFAULT_VCARD_MY_INFO,
  education: [],
  experience: [],
  services: [],
  generalPosts: [],
  faqs: [],
  customTabs: [],
  tabLabelOverrides: {},
  design: null,
  isVisible: () => true,
  isNavVisible: () => true,
  field: (key) => getFieldConfig(resolveDisplaySettings(), key),
  personalValue: () => '',
  socialHref: () => '',
  pageColors: getPageColors(resolveDisplaySettings()),
  homeMedia: getHomeMediaUrls(resolveDisplaySettings(), FALLBACK_PERSONAL),
  embedded: false,
  previewActive: true,
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
  myInfo,
  education,
  experience,
  services,
  generalPosts,
  faqs,
  customTabs,
  tabLabelOverrides,
  design,
  /** Explicit avatar from card meta (merged into homeMedia.profileMedia). */
  avatarMediaUrl,
  /** Editor phone preview: show all sections regardless of Card Settings visibility. */
  embedded = false,
  previewActive = true,
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
  myInfo?: VCardMyInfo
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  services?: VCardServiceEntry[]
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  customTabs?: VCardCustomTab[]
  tabLabelOverrides?: VCardTabLabelOverrides
  design?: ResolvedProfileDesign | null
  avatarMediaUrl?: string
  embedded?: boolean
  previewActive?: boolean
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
    const info = myInfo ?? DEFAULT_VCARD_MY_INFO
    const edu = education ?? []
    const exp = experience ?? []
    const svc = services ?? []
    const posts = generalPosts ?? []
    const faqEntries = faqs ?? []
    const custom = customTabs ?? []
    const labels = tabLabelOverrides ?? {}
    return {
      settings,
      personal: p,
      social: soc,
      extraFields: extras,
      myInfo: info,
      education: edu,
      experience: exp,
      services: svc,
      generalPosts: posts,
      faqs: faqEntries,
      customTabs: custom,
      tabLabelOverrides: labels,
      design: design ?? null,
      isVisible: (key: string) => isFieldVisibleInProfile(settings, key),
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
      previewActive,
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
    myInfo,
    education,
    experience,
    services,
    generalPosts,
    faqs,
    customTabs,
    tabLabelOverrides,
    design,
    avatarMediaUrl,
    embedded,
    previewActive,
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
