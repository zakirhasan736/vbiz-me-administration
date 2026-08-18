import { AI_ASSISTANCE_SETTING_KEY, isAiAssistanceEnabled } from '@/lib/aiAssistance'
import {
  hydrateDisplaySettingsFromProfile,
  settingsRowsToMap,
} from '@/lib/api/myCard/hydrateDisplaySettingsFromProfile'
import {
  CUSTOM_TABS_SETTING_KEY,
  mapVCardEditorSettingsPayload,
  parseThemeJson,
  TAB_LABEL_OVERRIDES_SETTING_KEY,
  THEME_SETTING_KEY,
} from '@/lib/api/myCard/mapDisplaySettingsToApi'
import { resolveCardStatus } from '@/lib/cardStatus'
import { parseSeoSettings } from '@/lib/seo/cardSeo'
import { getStaticProfileTheme } from '@/lib/staticProfileThemes'
import { applyEditorSettingsToThemeConfig, hasDynamicTheme, resolveCardThemeConfig } from '@/lib/theme/resolveCardTheme'
import { MY_INFO_SETTING_KEY, parseMyInfoJson } from '@/lib/vcardMyInfo'
import { skillTagsToGroups } from '@/lib/vcardSkills'
import { api } from '@/redux/api/api'
import { patchItem as patchAdminVCardsListItem } from '@/redux/features/adminVCardsList/adminVCardsList.slice'
import type { VCardCustomTab, VCardData, VCardFaqEntry, VCardGeneralPost, VCardRecord } from '@/types/vcard'
import { createDefaultVCardData } from '@/types/vcard'

export type ApiProfile = {
  id: string
  slug: string | null
  name: string
  email: string
  phone?: string | null
  whatsapp?: string | null
  website?: string | null
  companyName?: string | null
  designation?: string | null
  about?: string | null
  address?: string | null
  avatar?: string | null
  addresses?: Array<{
    id?: string
    line1?: string | null
    isPrimary?: boolean
  }>
  prof?: string | null
  dob?: string | null
  template?: string
  isPublic?: boolean
  isDraft?: boolean
  viewCount?: number
  clickCount?: number
  saveCount?: number
  shareCount?: number
  socialClicks?: Array<{ channel: string; label: string; clickCount: number }>
  userId?: string | null
  companyUserId?: string | null
  createdById?: string | null
  user?: { id?: string; name?: string | null; email?: string; role?: string | null } | null
  companyUser?: { id?: string; name?: string | null; role?: string | null } | null
  createdBy?: { id?: string; name?: string | null; role?: string | null } | null
  createdAt?: string
  updatedAt?: string
  facebook?: string | null
  instagram?: string | null
  twitter?: string | null
  tiktok?: string | null
  youtube?: string | null
  linkedin?: string | null
  rumble?: string | null
  truth?: string | null
  status?: { id?: string; name?: string | null } | null
  gender?: { id?: string; name?: string | null } | null
  maritalStatus?: { id?: string; name?: string | null } | null
  education?: Array<{
    id: string
    institute?: string | null
    degree?: string | null
    fromDate?: string | null
    toDate?: string | null
    tillNow?: boolean
  }>
  experiences?: Array<{
    id: string
    company?: string | null
    jobTitle?: string | null
    description?: string | null
    fromDate?: string | null
    toDate?: string | null
    tillNow?: boolean
  }>
  services?: Array<{
    id: string
    title?: string | null
    description?: string | null
    imageUrl?: string | null
    reviewUrl?: string | null
    status?: number | null
  }>
  portfolios?: Array<{
    id: string
    title?: string | null
    description?: string | null
    url?: string | null
    imageUrl?: string | null
    featuredImage?: string | null
    attachmentUrl?: string | null
    attachmentName?: string | null
    status?: number | string | null
  }>
  galleries?: Array<{
    id: string
    title?: string | null
    description?: string | null
    url?: string | null
    featuredImage?: string | null
    attachmentUrl?: string | null
    attachmentName?: string | null
    status?: string | null
  }>
  reviews?: Array<{
    id: string
    author?: string | null
    text?: string | null
    rating?: number | null
    status?: number | null
  }>
  skillTags?: Array<{
    id: string
    name?: string | null
    level?: string | null
  }>
  socialLinks?: Array<{ id: string; name?: string | null; url?: string | null; icon?: string | null }>
  profileSettings?: {
    profileTemplate?: string
    layoutStyle?: string | null
    buttonStyle?: string | null
    cornerStyle?: string | null
    themeConfig?: unknown
  } | null
  /** Legacy / top-level theme config mirror when present on profile payloads. */
  themeConfig?: unknown
  settings?: Array<{ key: string; value: string | null }>
  attachments?: Array<{
    url?: string | null
    path?: string | null
    fileUrl?: string | null
    docName?: string | null
    attachmentType?: { name?: string | null } | null
  }>
}

export type ApiPost = {
  id: string
  title?: string | null
  description?: string | null
  url?: string | null
  featuredImage?: string | null
  status?: string | null
  sortOrder?: number | null
  postType?: { id?: string; name?: string | null; title?: string | null } | null
  metas?: Array<{ metaKey: string; metaValue: string | null }>
  attachments?: Array<{
    id?: string
    docName?: string | null
    url?: string | null
    mimeType?: string | null
  }>
  createdAt?: string
  updatedAt?: string
  category?: string | null
  date?: string | null
  tabKey?: string
}

/** Normalize Blog / TabItem API rows into the ApiPost shape used by editor sync mappers. */
export function normalizeDirectItemToApiPost(row: ApiPost | null | undefined): ApiPost {
  if (!row) return { id: '' }
  const metasObj =
    row.metas && !Array.isArray(row.metas) && typeof row.metas === 'object'
      ? (row.metas as unknown as Record<string, string>)
      : null
  const metasArray = Array.isArray(row.metas)
    ? row.metas
    : metasObj
      ? Object.entries(metasObj).map(([metaKey, metaValue]) => ({
          metaKey,
          metaValue: metaValue ?? null,
        }))
      : [
          ...(row.category ? [{ metaKey: 'category', metaValue: row.category }] : []),
          ...(row.date ? [{ metaKey: 'date', metaValue: row.date }] : []),
        ]
  return {
    ...row,
    metas: metasArray,
  }
}

export type PostDocumentPayload = {
  url: string
  name?: string
  type?: string
}

type Envelope<T> = { success: boolean; data: T; message?: string; totalDoc?: number }

export type DashboardSocialChannel =
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'whatsapp'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'truth'
  | 'rumble'
  | 'pinterest'
  | 'website'

export type DashboardPeriod = 'all' | '7' | '30' | '90'

export type DashboardStats = {
  cards: number
  totalViews: number
  viewsLast30Days: number
  contactsLast30Days: number
  notesLast30Days: number
  guestsLast30Days: number
  uniqueViews?: number
  shares?: number
  period?: DashboardPeriod
  visitsChart: {
    total: number
    trendPercent: number
    points: Array<{ name: string; total: number }>
  }
  socialChannels: Array<{
    channel: DashboardSocialChannel
    label: string
    count: number
    trendPercent: number
  }>
  recentEngagement: Array<{
    id: string
    event: string
    viewer: string
    time: string
    platform: string
    createdAt: string
  }>
  profiles?: Array<{
    id: string
    name: string
    slug: string
    viewCount: number
    services: number
    portfolios: number
    posts: number
  }>
}

export type DashboardStatsQuery = {
  period?: DashboardPeriod
  scope?: 'created'
}

export type ProfilesListQuery = {
  scope?: 'created'
  q?: string
  status?: 'all' | 'active' | 'inactive' | 'paused' | 'suspended' | 'draft'
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'viewCount'
  sortDir?: 'asc' | 'desc'
  skip?: number
  limit?: number
}

export type WeeklyEngagementQuery = {
  scope?: 'created'
  profileId?: string
}

export type ProfileContact = {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  message?: string | null
  createdAt?: string
  profile?: { id?: string; name?: string | null; slug?: string | null } | null
  source?: 'guest_save' | 'contact' | 'note'
  privateNotes?: string
  lastReply?: string
  lastReplyAt?: string
}

export type TeamNotice = {
  id: string
  text: string
  type: 'broadcast' | 'system' | 'info' | 'warning' | 'success'
  audience: 'all' | 'savers'
  targetCardId?: string
  recipientCount?: number
  createdAt: string
  status?: string
}

export type SocialClicksByCardRow = {
  profileId: string
  channels: LiveSocialClickRow[]
}

export type SocialClicksQuery = {
  profileId?: string
  scope?: 'created'
}

export type CardCapacity = {
  limit: number
  used: number
  canCreate: boolean
}

export type OwnerPackageFeature = {
  id?: string
  featureKey: string
  featureValue?: string | null
}

export type OwnerPackage = {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  monthlyPrice: number
  yearlyPrice: number
  sortOrder?: number
  features?: OwnerPackageFeature[]
}

export type OwnerSubscription = {
  id: string
  packageId?: string | null
  endsAt?: string | null
  stripeStatus?: string | null
  createdAt: string
  package?: OwnerPackage | null
}

export type ProfilesListResult = {
  items: ApiProfile[]
  total: number
  capacity: CardCapacity
}

export type DashboardEngagementRow = {
  id: string
  event: string
  viewer: string
  time: string
  platform: string
  createdAt: string
}

export type DashboardEngagementPage = {
  items: DashboardEngagementRow[]
  total: number
  skip: number
  limit: number
}

export type DashboardEngagementQuery = {
  skip?: number
  limit?: number
  profileId?: string
  eventType?: string
}

export type DashboardSummary = {
  stats: DashboardStats
  recentEngagement: DashboardEngagementPage
  contactsPreview: ProfileContact[]
  socialClicks?: LiveSocialClickRow[]
  socialClicksByCard?: SocialClicksByCardRow[]
}

/** Shared RTK options for overview dashboards: reuse cache, skip focus refetch. */
export const dashboardOverviewQueryOptions = {
  refetchOnFocus: false as const,
  refetchOnReconnect: true as const,
  refetchOnMountOrArgChange: 30,
}

export type LiveSocialClickRow = {
  label: string
  channel: string
  clickCount: number
}

export type WeeklyEngagementDay = {
  day: string
  fullDay: string
  views: number
  clicks: number
  ctr: number
}

export type WeeklyEngagement = {
  days: WeeklyEngagementDay[]
  totals: { views: number; clicks: number; avgCtr: number }
  profileName: string
}

export type ConsolidatedEngagementSeries = {
  key: string
  label: string
  color: string
}

export type ConsolidatedEngagementMonth = {
  name: string
  total: number
  [seriesKey: string]: string | number
}

export type ConsolidatedEngagement = {
  months: ConsolidatedEngagementMonth[]
  series: ConsolidatedEngagementSeries[]
}

export type ConsolidatedEngagementQuery = {
  scope?: 'created'
}

export const BLOG_POST_TYPE = 'blog'
export const FAQ_POST_TYPE = 'Faq'

const templateToAppearance = (template?: string) => {
  if (template === 'dynamic' || template === 'v1') return 'v1' as const
  if (template === 'classic' || template === 'v2') return 'v2' as const
  return 'v3' as const
}

function metaMap(metas?: ApiPost['metas']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of metas || []) {
    if (m.metaKey) out[m.metaKey] = m.metaValue ?? ''
  }
  return out
}

function parseCustomTabs(raw?: string): VCardCustomTab[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((tab): tab is Partial<VCardCustomTab> => Boolean(tab && typeof tab === 'object'))
      .map((tab) => ({
        id: typeof tab.id === 'string' ? tab.id : '',
        label: typeof tab.label === 'string' && tab.label.trim() ? tab.label : 'Custom tab',
        items: Array.isArray(tab.items)
          ? (tab.items as unknown[]).map((raw) => {
              const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
              return {
                id: typeof item.id === 'string' ? item.id : '',
                title: typeof item.title === 'string' ? item.title : '',
                description: typeof item.description === 'string' ? item.description : '',
                url: typeof item.url === 'string' ? item.url : '',
                mediaUrl: typeof item.mediaUrl === 'string' ? item.mediaUrl : '',
                mediaName: typeof item.mediaName === 'string' ? item.mediaName : '',
                mediaKind: item.mediaKind as VCardCustomTab['items'][number]['mediaKind'],
                gallery: Array.isArray(item.gallery) ? item.gallery : [],
                active: item.active !== false,
              }
            })
          : [],
      }))
      .filter((tab) => tab.id.startsWith('custom-tab-'))
  } catch {
    return []
  }
}

function parseTabLabelOverrides(raw?: string): Record<string, string> {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([id, label]) => [id, typeof label === 'string' ? label.trim() : ''] as const)
        .filter(([, label]) => Boolean(label))
    )
  } catch {
    return {}
  }
}

/** Normalize API date/datetime to `yyyy-MM-dd` for `<input type="date">`. */
export function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10)
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ''
  const y = parsed.getUTCFullYear()
  const m = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const d = String(parsed.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function mapApiPostsToGeneralPosts(posts: ApiPost[]): VCardGeneralPost[] {
  return posts.map((p) => {
    const metas = metaMap(p.metas)
    return {
      id: p.id,
      category: metas.category || p.category || '',
      title: p.title || '',
      description: p.description || '',
      customUrl: p.url || '',
      featuredImage: p.featuredImage || '',
      date: toDateInputValue(metas.date || p.date || (p.createdAt ? String(p.createdAt) : '')),
      active: p.status !== '0' && p.status !== 'false',
    }
  })
}

export function mapApiPostsToFaqs(posts: ApiPost[]): VCardFaqEntry[] {
  return posts.map((p) => ({
    id: p.id,
    question: p.title || '',
    answer: p.description || '',
    featuredImage: p.featuredImage || '',
    url: p.url || '',
    active: p.status !== '0' && p.status !== 'false',
  }))
}

export function mapApiProfileToVCardRecord(profile: ApiProfile): VCardRecord {
  const { displaySettings, avatarImageUrl, backgroundImageUrl, explainerVideoUrl } = hydrateDisplaySettingsFromProfile({
    settings: profile.settings,
    attachments: profile.attachments,
    avatar: profile.avatar,
  })
  const settingsMap = settingsRowsToMap(profile.settings)
  const profileTemplate = templateToAppearance(profile.profileSettings?.profileTemplate || profile.template)
  const rawThemeConfig = profile.profileSettings?.themeConfig ?? profile.themeConfig
  const themeConfig = hasDynamicTheme(rawThemeConfig)
    ? resolveCardThemeConfig(rawThemeConfig, profileTemplate)
    : undefined
  const staticTheme = getStaticProfileTheme(profileTemplate)
  const savedTheme = parseThemeJson(settingsMap[THEME_SETTING_KEY])
  const customTabs = parseCustomTabs(settingsMap[CUSTOM_TABS_SETTING_KEY])
  const tabLabelOverrides = parseTabLabelOverrides(settingsMap[TAB_LABEL_OVERRIDES_SETTING_KEY])
  const theme = {
    primaryColor: savedTheme?.primaryColor || staticTheme.primaryColor,
    accentColor: savedTheme?.accentColor || staticTheme.accentColor,
    darkMode: typeof savedTheme?.darkMode === 'boolean' ? savedTheme.darkMode : staticTheme.darkMode,
    fontFamily: savedTheme?.fontFamily || staticTheme.fontFamily,
  }

  const data = createDefaultVCardData({
    slug: profile.slug || '',
    isPublic: profile.isPublic ?? true,
    isDraft: profile.isDraft === true,
    theme,
    ...(themeConfig ? { themeConfig } : {}),
    personal: {
      fullName: profile.name,
      email: profile.email,
      dob: toDateInputValue(profile.dob),
      gender: profile.gender?.name || 'Male',
      relationship: profile.maritalStatus?.name || 'Single',
      profession: profile.prof || '',
      designation: profile.designation || '',
      company: profile.companyName || '',
      phone: profile.phone || '',
      whatsapp: profile.whatsapp || '',
      address: profile.address || '',
      website: profile.website || '',
      about: profile.about || '',
      explainerVideoUrl,
    },
    appearance: {
      profileTemplate,
      layoutStyle: profile.profileSettings?.layoutStyle || 'classic',
      buttonStyle: profile.profileSettings?.buttonStyle || 'solid',
      cornerStyle: profile.profileSettings?.cornerStyle || 'round',
    },
    social: {
      handles: {
        facebook: profile.facebook || '',
        instagram: profile.instagram || '',
        twitter: profile.twitter || '',
        tiktok: profile.tiktok || '',
        youtube: profile.youtube || '',
        linkedin: profile.linkedin || '',
        rumble: profile.rumble || '',
        truth: profile.truth || '',
      },
      customLinks: (profile.socialLinks || []).map((s) => ({
        id: s.id,
        name: s.name || 'Link',
        url: s.url || '',
      })),
      games: {},
    },
    education: (profile.education || []).map((e) => ({
      id: e.id,
      institute: e.institute || '',
      degree: e.degree || '',
      fromDate: toDateInputValue(e.fromDate),
      toDate: toDateInputValue(e.toDate),
      tillNow: Boolean(e.tillNow),
    })),
    experience: (profile.experiences || []).map((e) => ({
      id: e.id,
      company: e.company || '',
      jobTitle: e.jobTitle || '',
      description: e.description || '',
      fromDate: toDateInputValue(e.fromDate),
      toDate: toDateInputValue(e.toDate),
      tillNow: Boolean(e.tillNow),
    })),
    services: (profile.services || []).map((s) => ({
      id: s.id,
      type: 'Service',
      title: s.title || '',
      description: s.description || '',
      url: s.reviewUrl || '',
      featuredImage: s.imageUrl || '',
      active: s.status !== 0,
    })),
    portfolio: (() => {
      const galleries = profile.galleries || []
      const portfolios = profile.portfolios || []
      const byTitle = new Map(
        portfolios.map(
          (row) =>
            [
              String(row.title || '')
                .trim()
                .toLowerCase(),
              row,
            ] as const
        )
      )
      const rows =
        galleries.length > 0
          ? galleries.map((gallery, index) => {
              const legacy =
                byTitle.get(
                  String(gallery.title || '')
                    .trim()
                    .toLowerCase()
                ) || portfolios[index]
              return {
                ...gallery,
                featuredImage: gallery.featuredImage || legacy?.imageUrl || gallery.featuredImage,
                imageUrl: ('imageUrl' in gallery ? gallery.imageUrl : undefined) || legacy?.imageUrl,
                attachmentUrl: gallery.attachmentUrl || legacy?.attachmentUrl || gallery.attachmentUrl,
                attachmentName: gallery.attachmentName || legacy?.attachmentName || gallery.attachmentName,
              }
            })
          : portfolios
      return rows.map((p) => {
        const imageUrl = String(('featuredImage' in p && p.featuredImage) || ('imageUrl' in p && p.imageUrl) || '')
        const status = p.status
        const active = status !== 0 && status !== '0'
        const attachmentUrl = typeof p.attachmentUrl === 'string' ? p.attachmentUrl : ''
        const attachmentName = typeof p.attachmentName === 'string' ? p.attachmentName : ''
        return {
          id: p.id,
          type: 'Image' as const,
          title: p.title || '',
          description: p.description || '',
          imageUrl,
          imageName: attachmentName,
          attachments: attachmentUrl ? { url: attachmentUrl, name: attachmentName } : null,
          url: p.url || '',
          active,
        }
      })
    })(),
    reviews: (profile.reviews || []).map((r) => {
      const rawRating = typeof r.rating === 'number' ? r.rating : Number(r.rating)
      const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 5
      return {
        id: r.id,
        author: r.author || '',
        text: r.text || '',
        rating,
      }
    }),
    skills: skillTagsToGroups(profile.skillTags),
    displaySettings,
    customTabs,
    tabLabelOverrides,
    myInfo: parseMyInfoJson(settingsMap[MY_INFO_SETTING_KEY]),
    seo: parseSeoSettings(settingsMap),
    aiAssistanceEnabled: isAiAssistanceEnabled(settingsMap[AI_ASSISTANCE_SETTING_KEY]),
  })

  const status = resolveCardStatus({
    status: profile.status?.name,
    isDraft: profile.isDraft,
    isPublic: profile.isPublic,
  })

  return {
    ...data,
    id: profile.id,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
    views: profile.viewCount || 0,
    saves: Number(profile.saveCount) || 0,
    clickCount: Number(profile.clickCount) || 0,
    shareCount: Number(profile.shareCount ?? profile.clickCount) || 0,
    socialClicks: profile.socialClicks || [],
    avatarImageUrl,
    backgroundImageUrl,
    status,
    isActive: status === 'active',
    isDraft: profile.isDraft === true,
  }
}

export function mapVCardDataToProfilePayload(data: VCardData) {
  const dob = (data.personal.dob || '').trim()
  const profileMediaUrl = data.displaySettings?.fields?.['Profile Image/Video']?.customValue?.trim() || ''
  const avatar =
    profileMediaUrl && !profileMediaUrl.startsWith('blob:') && /^(https?:\/\/|\/)/i.test(profileMediaUrl)
      ? profileMediaUrl
      : ''
  const themeConfig = applyEditorSettingsToThemeConfig(data.themeConfig, data.theme, data.appearance)

  return {
    name: data.personal.fullName,
    email: data.personal.email,
    slug: data.slug,
    companyName: data.personal.company,
    designation: data.personal.designation,
    phone: data.personal.phone,
    whatsapp: data.personal.whatsapp,
    website: data.personal.website,
    address: data.personal.address,
    prof: data.personal.profession,
    dob: dob || null,
    isPublic: data.isDraft ? false : data.isPublic,
    isDraft: data.isDraft !== false,
    avatar,
    template:
      data.appearance?.profileTemplate === 'v1'
        ? 'dynamic'
        : data.appearance?.profileTemplate === 'v2'
          ? 'classic'
          : 'default',
    facebook: data.social?.handles?.facebook,
    instagram: data.social?.handles?.instagram,
    twitter: data.social?.handles?.twitter,
    tiktok: data.social?.handles?.tiktok,
    youtube: data.social?.handles?.youtube,
    linkedin: data.social?.handles?.linkedin,
    settings: mapVCardEditorSettingsPayload(data),
    profileSettings: {
      ...(data.appearance
        ? {
            profileTemplate: data.appearance.profileTemplate,
            layoutStyle: data.appearance.layoutStyle,
            buttonStyle: data.appearance.buttonStyle,
            cornerStyle: data.appearance.cornerStyle,
          }
        : {}),
      ...(themeConfig ? { themeConfig } : {}),
    },
  }
}

function isLocalTempId(id: string): boolean {
  return /^(pf_|sk_|post_|faq_|svc_|sec_|rev_|edu_|exp_|cert_|custom_item_)/.test(id)
}

type VisibilityPatchTarget = {
  isPublic?: boolean
  isDraft?: boolean
  status?: { id?: string; name?: string | null } | null
}

/** Body that only flips public/draft/status — safe to patch list cache without full LIST refetch. */
function isVisibilityStatusOnlyBody(body: Record<string, unknown>): boolean {
  const keys = Object.keys(body)
  return keys.length > 0 && keys.every((k) => k === 'isPublic' || k === 'isDraft' || k === 'status')
}

function visibilityStatusName(body: Record<string, unknown>, profile: VisibilityPatchTarget): string | undefined {
  if (typeof body.status === 'string' && body.status.trim()) return body.status.trim().toLowerCase()
  if (profile.isDraft) return 'draft'
  if (profile.isPublic === false) return 'inactive'
  if (profile.isPublic === true) return 'active'
  return undefined
}

function applyVisibilityStatusPatch(profile: VisibilityPatchTarget, body: Record<string, unknown>) {
  const patchIsPublic = typeof body.isPublic === 'boolean'
  const patchIsDraft = typeof body.isDraft === 'boolean'
  if (patchIsDraft) {
    profile.isDraft = body.isDraft as boolean
    if (body.isDraft === true) {
      profile.isPublic = false
    } else if (!patchIsPublic) {
      profile.isPublic = true
    } else {
      profile.isPublic = body.isPublic as boolean
    }
  } else if (patchIsPublic) {
    profile.isPublic = body.isPublic as boolean
  }
  const nextName = visibilityStatusName(body, profile)
  if (nextName) {
    profile.status = { id: profile.status?.id || '', name: nextName }
  }
}

/** Injected endpoints are not on base `api` typings; cast util for cache patches. */
function patchGetProfilesCache(
  dispatch: (action: unknown) => { undo: () => void },
  args: ProfilesListQuery | void,
  recipe: (draft: ProfilesListResult) => void
) {
  return dispatch(
    (
      api.util.updateQueryData as unknown as (
        endpointName: 'getProfiles',
        endpointArgs: ProfilesListQuery | void,
        updateRecipe: (draft: ProfilesListResult) => void
      ) => unknown
    )('getProfiles', args, recipe)
  )
}

function patchGetProfileCache(
  dispatch: (action: unknown) => { undo: () => void },
  id: string,
  recipe: (draft: ApiProfile) => void
) {
  return dispatch(
    (
      api.util.updateQueryData as unknown as (
        endpointName: 'getProfile',
        endpointArgs: string,
        updateRecipe: (draft: ApiProfile) => void
      ) => unknown
    )('getProfile', id, recipe)
  )
}

function patchGetAdminProfilesCache(
  dispatch: (action: unknown) => { undo: () => void },
  args: unknown,
  recipe: (draft: { items: Array<VisibilityPatchTarget & { id: string }> }) => void
) {
  return dispatch(
    (
      api.util.updateQueryData as unknown as (
        endpointName: 'getAdminProfiles',
        endpointArgs: unknown,
        updateRecipe: (draft: { items: Array<VisibilityPatchTarget & { id: string }> }) => void
      ) => unknown
    )('getAdminProfiles', args, recipe)
  )
}

const profilesApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProfiles: builder.query<ProfilesListResult, ProfilesListQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.scope) search.set('scope', params.scope)
        if (params?.q) search.set('q', params.q)
        if (params?.status && params.status !== 'all') search.set('status', params.status)
        if (params?.sortBy) search.set('sortBy', params.sortBy)
        if (params?.sortDir) search.set('sortDir', params.sortDir)
        if (params?.skip != null) search.set('skip', String(params.skip))
        if (params?.limit != null) search.set('limit', String(params.limit))
        const qs = search.toString()
        return qs ? `/profiles?${qs}` : '/profiles'
      },
      transformResponse: (res: Envelope<ProfilesListResult | ApiProfile[]>) => {
        const payload = res.data
        if (Array.isArray(payload)) {
          return {
            items: payload,
            total: res.totalDoc ?? payload.length,
            capacity: {
              limit: Number.MAX_SAFE_INTEGER,
              used: payload.length,
              canCreate: true,
            },
          }
        }
        return {
          items: payload?.items || [],
          total: payload?.total ?? res.totalDoc ?? 0,
          capacity: payload?.capacity || {
            limit: Number.MAX_SAFE_INTEGER,
            used: payload?.items?.length || 0,
            canCreate: true,
          },
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({ type: 'profiles' as const, id: p.id })),
              { type: 'profiles' as const, id: 'LIST' },
            ]
          : [{ type: 'profiles', id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),
    getProfile: builder.query<ApiProfile, string>({
      query: (id) => `/profiles/${id}`,
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'profiles', id }],
    }),
    checkSlug: builder.query<
      { slug: string; available: boolean; suggestion: string },
      { slug: string; excludeId?: string }
    >({
      query: ({ slug, excludeId }) => {
        const params = new URLSearchParams({ slug })
        if (excludeId) params.set('excludeId', excludeId)
        return `/profiles/check-slug?${params.toString()}`
      },
      transformResponse: (res: Envelope<{ slug: string; available: boolean; suggestion: string }>) => res.data,
    }),
    createProfile: builder.mutation<
      ApiProfile,
      Partial<ReturnType<typeof mapVCardDataToProfilePayload>> & { ownerUserId?: string }
    >({
      query: (body) => ({ url: '/profiles', method: 'POST', body }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: [
        { type: 'profiles', id: 'LIST' },
        { type: 'adminProfiles', id: 'LIST' },
        { type: 'adminProfiles', id: 'FILTERS' },
        'dashboard',
      ],
    }),
    duplicateProfile: builder.mutation<ApiProfile, string>({
      query: (id) => ({ url: `/profiles/${id}/duplicate`, method: 'POST' }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: [
        { type: 'profiles', id: 'LIST' },
        { type: 'adminProfiles', id: 'LIST' },
        { type: 'adminProfiles', id: 'FILTERS' },
        'dashboard',
      ],
    }),
    updateProfileCard: builder.mutation<ApiProfile, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/profiles/${id}`, method: 'PATCH', body }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled, getState }) {
        const runDispatch = dispatch as unknown as (action: unknown) => { undo: () => void }
        if (!isVisibilityStatusOnlyBody(body)) {
          try {
            const { data } = await queryFulfilled
            if (!data) return
            patchGetProfileCache(runDispatch, id, (draft) => {
              Object.assign(draft, data)
            })
          } catch {
            /* keep existing cache on failed save */
          }
          return
        }

        const patchResults: Array<{ undo: () => void }> = []
        const applyServerVisibility = (item: VisibilityPatchTarget, data: ApiProfile) => {
          item.isPublic = data.isPublic
          item.isDraft = data.isDraft
          if (data.status) item.status = data.status
        }

        const listEntries = api.util.selectInvalidatedBy(getState(), [{ type: 'profiles', id: 'LIST' }])
        for (const entry of listEntries) {
          if (entry.endpointName !== 'getProfiles') continue
          patchResults.push(
            patchGetProfilesCache(runDispatch, entry.originalArgs as ProfilesListQuery | void, (draft) => {
              const item = draft.items.find((p) => p.id === id)
              if (item) applyVisibilityStatusPatch(item, body)
            })
          )
        }

        const adminListEntries = api.util.selectInvalidatedBy(getState(), [{ type: 'adminProfiles', id: 'LIST' }])
        for (const entry of adminListEntries) {
          if (entry.endpointName !== 'getAdminProfiles') continue
          patchResults.push(
            patchGetAdminProfilesCache(runDispatch, entry.originalArgs, (draft) => {
              const item = draft.items.find((p) => p.id === id)
              if (item) applyVisibilityStatusPatch(item, body)
            })
          )
        }

        patchResults.push(
          patchGetProfileCache(runDispatch, id, (draft) => {
            applyVisibilityStatusPatch(draft, body)
          })
        )

        const adminListState = (
          getState() as {
            adminVCardsList?: {
              accumulatedItems: Array<{
                id: string
                isPublic?: boolean
                isDraft?: boolean
                status?: { id?: string; name?: string } | null
              }>
            }
          }
        ).adminVCardsList
        const prevAdminRow = adminListState?.accumulatedItems.find((row) => row.id === id)
        const nextStatusName =
          typeof body.status === 'string'
            ? body.status.trim().toLowerCase()
            : typeof body.isPublic === 'boolean'
              ? body.isPublic
                ? 'active'
                : 'inactive'
              : undefined
        dispatch(
          patchAdminVCardsListItem({
            id,
            ...(typeof body.isPublic === 'boolean' ? { isPublic: body.isPublic } : {}),
            ...(typeof body.isDraft === 'boolean' ? { isDraft: body.isDraft } : {}),
            ...(nextStatusName ? { statusName: nextStatusName } : {}),
          })
        )

        try {
          const { data } = await queryFulfilled
          if (!data) return

          for (const entry of api.util.selectInvalidatedBy(getState(), [{ type: 'profiles', id: 'LIST' }])) {
            if (entry.endpointName !== 'getProfiles') continue
            patchGetProfilesCache(runDispatch, entry.originalArgs as ProfilesListQuery | void, (draft) => {
              const item = draft.items.find((p) => p.id === id)
              if (item) applyServerVisibility(item, data)
            })
          }
          for (const entry of api.util.selectInvalidatedBy(getState(), [{ type: 'adminProfiles', id: 'LIST' }])) {
            if (entry.endpointName !== 'getAdminProfiles') continue
            patchGetAdminProfilesCache(runDispatch, entry.originalArgs, (draft) => {
              const item = draft.items.find((p) => p.id === id)
              if (item) applyServerVisibility(item, data)
            })
          }
          patchGetProfileCache(runDispatch, id, (draft) => {
            applyServerVisibility(draft, data)
          })
          dispatch(
            patchAdminVCardsListItem({
              id,
              isPublic: data.isPublic,
              isDraft: data.isDraft,
              statusName: data.status?.name || nextStatusName,
            })
          )
        } catch {
          patchResults.forEach((p) => p.undo())
          if (prevAdminRow) {
            dispatch(
              patchAdminVCardsListItem({
                id,
                isPublic: prevAdminRow.isPublic,
                isDraft: prevAdminRow.isDraft,
                statusName: prevAdminRow.status?.name,
              })
            )
          }
        }
      },
      invalidatesTags: () => [],
    }),
    deleteProfile: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/profiles/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'profiles', id: 'LIST' },
        { type: 'adminProfiles', id: 'LIST' },
        { type: 'adminProfiles', id: 'FILTERS' },
        'dashboard',
      ],
    }),
    replaceEducation: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/education`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: () => [],
    }),
    replaceExperiences: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/experiences`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: () => [],
    }),
    replaceServices: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/services`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: () => [],
    }),
    replacePortfolios: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/portfolios`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: () => [],
    }),
    replaceReviews: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/reviews`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: () => [],
    }),
    replaceSkills: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/skills`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: () => [],
    }),
    replaceSocialLinks: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/social-links`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: () => [],
    }),
    listProfilePosts: builder.query<ApiPost[], { id: string; postType?: string }>({
      query: ({ id, postType }) =>
        postType ? `/profiles/${id}/posts?postType=${encodeURIComponent(postType)}` : `/profiles/${id}/posts`,
      transformResponse: (res: Envelope<ApiPost[]>) => res.data || [],
      providesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:posts` }],
    }),
    createProfilePost: builder.mutation<
      ApiPost,
      {
        id: string
        body: {
          title?: string
          description?: string
          postTypeName?: string
          url?: string
          featuredImage?: string
          status?: string
          metas?: Record<string, string>
          documents?: PostDocumentPayload[]
        }
      }
    >({
      query: ({ id, body }) => ({ url: `/profiles/${id}/posts`, method: 'POST', body }),
      transformResponse: (res: Envelope<ApiPost>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:posts` }],
    }),
    updateProfilePost: builder.mutation<
      ApiPost,
      {
        id: string
        postId: string
        body: {
          title?: string
          description?: string
          url?: string
          featuredImage?: string
          status?: string
          sortOrder?: number
          metas?: Record<string, string>
          documents?: PostDocumentPayload[]
        }
      }
    >({
      query: ({ id, postId, body }) => ({ url: `/profiles/${id}/posts/${postId}`, method: 'PATCH', body }),
      transformResponse: (res: Envelope<ApiPost>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:posts` }],
    }),
    deleteProfilePost: builder.mutation<{ id: string; deleted: boolean }, { id: string; postId: string }>({
      query: ({ id, postId }) => ({ url: `/profiles/${id}/posts/${postId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:posts` }],
    }),
    listProfileBlogs: builder.query<ApiPost[], string | { id: string; limit?: number }>({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id
        const limit = typeof arg === 'string' ? undefined : arg.limit
        return limit ? `/profiles/${id}/blogs?limit=${limit}` : `/profiles/${id}/blogs`
      },
      transformResponse: (res: Envelope<ApiPost[] | { items?: ApiPost[] }>) => {
        const payload = res.data
        const rows = Array.isArray(payload) ? payload : payload?.items || []
        return rows.map(normalizeDirectItemToApiPost)
      },
      providesTags: (_r, _e, arg) => {
        const id = typeof arg === 'string' ? arg : arg.id
        return [{ type: 'profiles', id: `${id}:blogs` }]
      },
    }),
    createProfileBlog: builder.mutation<
      ApiPost,
      {
        id: string
        body: {
          title?: string
          description?: string
          url?: string
          featuredImage?: string
          status?: string
          sortOrder?: number
          metas?: Record<string, string>
          category?: string
          date?: string
        }
      }
    >({
      query: ({ id, body }) => ({
        url: `/profiles/${id}/blogs`,
        method: 'POST',
        body: {
          ...body,
          category: body.category ?? body.metas?.category,
          date: body.date ?? body.metas?.date,
        },
      }),
      transformResponse: (res: Envelope<ApiPost>) => normalizeDirectItemToApiPost(res.data),
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:blogs` }],
    }),
    updateProfileBlog: builder.mutation<
      ApiPost,
      {
        id: string
        blogId: string
        body: {
          title?: string
          description?: string
          url?: string
          featuredImage?: string
          status?: string
          sortOrder?: number
          metas?: Record<string, string>
          category?: string
          date?: string
        }
      }
    >({
      query: ({ id, blogId, body }) => ({
        url: `/profiles/${id}/blogs/${blogId}`,
        method: 'PATCH',
        body: {
          ...body,
          category: body.category ?? body.metas?.category,
          date: body.date ?? body.metas?.date,
        },
      }),
      transformResponse: (res: Envelope<ApiPost>) => normalizeDirectItemToApiPost(res.data),
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:blogs` }],
    }),
    deleteProfileBlog: builder.mutation<{ deleted: boolean }, { id: string; blogId: string }>({
      query: ({ id, blogId }) => ({ url: `/profiles/${id}/blogs/${blogId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:blogs` }],
    }),
    listEditorSections: builder.query<{ blogs: ApiPost[]; tabs: Record<string, ApiPost[]> }, string>({
      query: (id) => `/profiles/${id}/editor-sections`,
      transformResponse: (res: Envelope<{ blogs?: ApiPost[]; tabs?: Record<string, ApiPost[]> }>) => {
        const payload = res.data || {}
        const tabs: Record<string, ApiPost[]> = {}
        for (const [key, rows] of Object.entries(payload.tabs || {})) {
          tabs[key] = (Array.isArray(rows) ? rows : []).map(normalizeDirectItemToApiPost)
        }
        return {
          blogs: (payload.blogs || []).map(normalizeDirectItemToApiPost),
          tabs,
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'profiles', id: `${id}:editor-sections` }],
    }),
    listProfileTabItems: builder.query<ApiPost[], { id: string; tabKey: string; limit?: number }>({
      query: ({ id, tabKey, limit }) =>
        `/profiles/${id}/tabs/${encodeURIComponent(tabKey)}${limit ? `?limit=${limit}` : ''}`,
      transformResponse: (res: Envelope<ApiPost[] | { items?: ApiPost[] }>) => {
        const payload = res.data
        const rows = Array.isArray(payload) ? payload : payload?.items || []
        return rows.map(normalizeDirectItemToApiPost)
      },
      providesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:tab:${arg.tabKey}` }],
    }),
    createProfileTabItem: builder.mutation<
      ApiPost,
      {
        id: string
        tabKey: string
        body: {
          title?: string
          description?: string
          url?: string
          featuredImage?: string
          status?: string
          sortOrder?: number
          metas?: Record<string, string>
        }
      }
    >({
      query: ({ id, tabKey, body }) => ({
        url: `/profiles/${id}/tabs/${encodeURIComponent(tabKey)}`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<ApiPost>) => normalizeDirectItemToApiPost(res.data),
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:tab:${arg.tabKey}` }],
    }),
    updateProfileTabItem: builder.mutation<
      ApiPost,
      {
        id: string
        tabKey: string
        itemId: string
        body: {
          title?: string
          description?: string
          url?: string
          featuredImage?: string
          status?: string
          sortOrder?: number
          metas?: Record<string, string>
        }
      }
    >({
      query: ({ id, tabKey, itemId, body }) => ({
        url: `/profiles/${id}/tabs/${encodeURIComponent(tabKey)}/${itemId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<ApiPost>) => normalizeDirectItemToApiPost(res.data),
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:tab:${arg.tabKey}` }],
    }),
    deleteProfileTabItem: builder.mutation<{ deleted: boolean }, { id: string; tabKey: string; itemId: string }>({
      query: ({ id, tabKey, itemId }) => ({
        url: `/profiles/${id}/tabs/${encodeURIComponent(tabKey)}/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: `${arg.id}:tab:${arg.tabKey}` }],
    }),
    getDashboardStats: builder.query<DashboardStats, DashboardStatsQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('period', params?.period ?? 'all')
        if (params?.scope) search.set('scope', params.scope)
        return `/profiles/dashboard/stats?${search.toString()}`
      },
      transformResponse: (res: Envelope<DashboardStats>) => res.data,
      providesTags: ['dashboard'],
      keepUnusedDataFor: 90,
    }),
    getDashboardSummary: builder.query<DashboardSummary, DashboardStatsQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('period', params?.period ?? 'all')
        if (params?.scope) search.set('scope', params.scope)
        return `/profiles/dashboard/summary?${search.toString()}`
      },
      transformResponse: (res: Envelope<DashboardSummary>) => res.data,
      providesTags: ['dashboard'],
      keepUnusedDataFor: 90,
    }),
    getRecentEngagement: builder.query<DashboardEngagementPage, DashboardEngagementQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        const skip = params?.skip ?? 0
        const limit = params?.limit ?? 10
        search.set('skip', String(skip))
        search.set('limit', String(limit))
        if (params?.profileId) search.set('profileId', params.profileId)
        if (params?.eventType) search.set('eventType', params.eventType)
        return `/profiles/dashboard/engagement?${search.toString()}`
      },
      transformResponse: (res: Envelope<DashboardEngagementPage>) => res.data,
      providesTags: ['dashboard'],
    }),
    getWeeklyEngagement: builder.query<WeeklyEngagement, WeeklyEngagementQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.scope) search.set('scope', params.scope)
        if (params?.profileId) search.set('profileId', params.profileId)
        const qs = search.toString()
        return qs ? `/profiles/dashboard/weekly-engagement?${qs}` : '/profiles/dashboard/weekly-engagement'
      },
      transformResponse: (res: Envelope<WeeklyEngagement>) => res.data,
      providesTags: ['dashboard'],
      keepUnusedDataFor: 60,
    }),
    getConsolidatedEngagement: builder.query<ConsolidatedEngagement, ConsolidatedEngagementQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.scope) search.set('scope', params.scope)
        const qs = search.toString()
        return qs ? `/profiles/dashboard/consolidated-engagement?${qs}` : '/profiles/dashboard/consolidated-engagement'
      },
      transformResponse: (res: Envelope<ConsolidatedEngagement>) => res.data || { months: [], series: [] },
      providesTags: ['dashboard'],
    }),
    getSocialClicks: builder.query<LiveSocialClickRow[], SocialClicksQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.scope) search.set('scope', params.scope)
        if (params?.profileId) search.set('profileId', params.profileId)
        const qs = search.toString()
        return qs ? `/profiles/dashboard/social-clicks?${qs}` : '/profiles/dashboard/social-clicks'
      },
      transformResponse: (res: Envelope<LiveSocialClickRow[]>) => res.data || [],
      providesTags: ['dashboard'],
      keepUnusedDataFor: 60,
    }),
    getSocialClicksByCard: builder.query<SocialClicksByCardRow[], SocialClicksQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.scope) search.set('scope', params.scope)
        const qs = search.toString()
        return qs ? `/profiles/dashboard/social-clicks-by-card?${qs}` : '/profiles/dashboard/social-clicks-by-card'
      },
      transformResponse: (res: Envelope<SocialClicksByCardRow[]>) => res.data || [],
      providesTags: ['dashboard'],
      keepUnusedDataFor: 60,
    }),
    exportDashboardOverview: builder.mutation<Blob, DashboardStatsQuery | void>({
      query: (params) => {
        const period = params?.period ?? 'all'
        return {
          url: `/profiles/dashboard/export?period=${encodeURIComponent(period)}`,
          method: 'GET',
          responseHandler: async (response: Response) => response.blob(),
        }
      },
    }),
    getPackages: builder.query<OwnerPackage[], void>({
      query: () => '/profiles/packages',
      transformResponse: (res: Envelope<OwnerPackage[]>) => res.data || [],
    }),
    getSubscriptions: builder.query<OwnerSubscription[], void>({
      query: () => '/profiles/subscriptions',
      transformResponse: (res: Envelope<OwnerSubscription[]>) => res.data || [],
    }),
    getContacts: builder.query<ProfileContact[], string | void>({
      query: (profileId) =>
        profileId ? `/profiles/contacts?profileId=${encodeURIComponent(profileId)}` : '/profiles/contacts',
      transformResponse: (res: Envelope<ProfileContact[]>) => res.data || [],
      providesTags: ['dashboard'],
      keepUnusedDataFor: 60,
    }),
    patchContact: builder.mutation<
      ProfileContact,
      { id: string; privateNotes?: string; lastReply?: string; source?: ProfileContact['source'] }
    >({
      query: ({ id, ...body }) => ({
        url: `/profiles/contacts/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<ProfileContact>) => res.data,
      invalidatesTags: ['dashboard'],
    }),
    exportContactsCsv: builder.mutation<Blob, string | void>({
      query: (profileId) => ({
        url: profileId
          ? `/profiles/contacts/export?profileId=${encodeURIComponent(profileId)}`
          : '/profiles/contacts/export',
        method: 'GET',
        responseHandler: async (response: Response) => response.blob(),
      }),
    }),
    getTeamNotices: builder.query<TeamNotice[], void>({
      query: () => '/profiles/team-notices',
      transformResponse: (res: Envelope<TeamNotice[]>) => res.data || [],
      providesTags: ['dashboard'],
    }),
    createTeamNotice: builder.mutation<
      TeamNotice,
      {
        text: string
        type: 'broadcast' | 'system' | 'info' | 'warning' | 'success'
        audience: 'all' | 'savers'
        targetProfileId?: string
      }
    >({
      query: (body) => ({ url: '/profiles/team-notices', method: 'POST', body }),
      transformResponse: (res: Envelope<TeamNotice>) => res.data,
      invalidatesTags: ['dashboard'],
    }),
    deleteTeamNotice: builder.mutation<{ id: string; deleted: boolean }, string>({
      query: (id) => ({ url: `/profiles/team-notices/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string; deleted: boolean }>) => res.data,
      invalidatesTags: ['dashboard'],
    }),
    uploadMedia: builder.mutation<
      { url: string; publicId: string; attachment?: unknown },
      { file: File; profileId?: string; attachmentType?: string }
    >({
      query: ({ file, profileId, attachmentType }) => {
        const form = new FormData()
        form.append('file', file)
        if (profileId) form.append('profileId', profileId)
        if (attachmentType) form.append('attachmentType', attachmentType)
        if (profileId) {
          form.append('attachableType', 'Profile')
          form.append('attachableId', profileId)
        }
        return { url: '/media/upload', method: 'POST', body: form }
      },
      transformResponse: (res: Envelope<{ url: string; publicId: string; attachment?: unknown }>) => res.data,
    }),
  }),
})

export { isLocalTempId }

export const {
  useGetProfilesQuery,
  useGetProfileQuery,
  useCheckSlugQuery,
  useCreateProfileMutation,
  useDuplicateProfileMutation,
  useUpdateProfileCardMutation,
  useDeleteProfileMutation,
  useReplaceEducationMutation,
  useReplaceExperiencesMutation,
  useReplaceServicesMutation,
  useReplacePortfoliosMutation,
  useReplaceReviewsMutation,
  useReplaceSkillsMutation,
  useReplaceSocialLinksMutation,
  useListProfilePostsQuery,
  useLazyListProfilePostsQuery,
  useCreateProfilePostMutation,
  useUpdateProfilePostMutation,
  useDeleteProfilePostMutation,
  useListProfileBlogsQuery,
  useLazyListProfileBlogsQuery,
  useListEditorSectionsQuery,
  useLazyListEditorSectionsQuery,
  useCreateProfileBlogMutation,
  useUpdateProfileBlogMutation,
  useDeleteProfileBlogMutation,
  useListProfileTabItemsQuery,
  useLazyListProfileTabItemsQuery,
  useCreateProfileTabItemMutation,
  useUpdateProfileTabItemMutation,
  useDeleteProfileTabItemMutation,
  useGetDashboardStatsQuery,
  useGetDashboardSummaryQuery,
  useGetRecentEngagementQuery,
  useGetWeeklyEngagementQuery,
  useGetConsolidatedEngagementQuery,
  useGetSocialClicksQuery,
  useGetSocialClicksByCardQuery,
  useExportDashboardOverviewMutation,
  useGetPackagesQuery,
  useGetSubscriptionsQuery,
  useGetContactsQuery,
  usePatchContactMutation,
  useExportContactsCsvMutation,
  useGetTeamNoticesQuery,
  useCreateTeamNoticeMutation,
  useDeleteTeamNoticeMutation,
  useUploadMediaMutation,
} = profilesApi

export default profilesApi
