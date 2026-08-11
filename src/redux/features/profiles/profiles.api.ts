import { hydrateDisplaySettingsFromProfile } from '@/lib/api/myCard/hydrateDisplaySettingsFromProfile'
import { mapVCardEditorSettingsPayload } from '@/lib/api/myCard/mapDisplaySettingsToApi'
import { skillTagsToGroups } from '@/lib/vcardSkills'
import { api } from '@/redux/api/api'
import type { VCardData, VCardFaqEntry, VCardGeneralPost, VCardRecord } from '@/types/vcard'
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
    attachmentUrl?: string | null
    attachmentName?: string | null
    status?: number | null
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
  } | null
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
  status?: 'all' | 'active' | 'inactive' | 'suspended' | 'draft'
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
      category: metas.category || '',
      title: p.title || '',
      description: p.description || '',
      customUrl: p.url || '',
      featuredImage: p.featuredImage || '',
      date: toDateInputValue(metas.date || (p.createdAt ? String(p.createdAt) : '')),
      active: p.status !== '0' && p.status !== 'false',
    }
  })
}

export function mapApiPostsToFaqs(posts: ApiPost[]): VCardFaqEntry[] {
  return posts.map((p) => ({
    id: p.id,
    question: p.title || '',
    answer: p.description || '',
    active: p.status !== '0' && p.status !== 'false',
  }))
}

export function mapApiProfileToVCardRecord(profile: ApiProfile): VCardRecord {
  const { displaySettings, avatarImageUrl, backgroundImageUrl, explainerVideoUrl } = hydrateDisplaySettingsFromProfile({
    settings: profile.settings,
    attachments: profile.attachments,
    avatar: profile.avatar,
  })

  const data = createDefaultVCardData({
    slug: profile.slug || '',
    isPublic: profile.isPublic ?? true,
    isDraft: profile.isDraft === true,
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
      profileTemplate: templateToAppearance(profile.profileSettings?.profileTemplate || profile.template),
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
    portfolio: (profile.portfolios || []).map((p) => ({
      id: p.id,
      type: 'Image',
      title: p.title || '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      imageName: '',
      attachments: p.attachmentUrl ? { url: p.attachmentUrl, name: p.attachmentName || '' } : null,
      url: p.url || '',
      active: p.status !== 0,
    })),
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
    isActive: profile.isDraft !== true && profile.isPublic !== false,
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
    about: data.personal.about,
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
      ...(data.themeConfig ? { themeConfig: data.themeConfig } : {}),
    },
  }
}

function isLocalTempId(id: string): boolean {
  return /^(pf_|sk_|post_|faq_|svc_|sec_|rev_)/.test(id)
}

const profilesApi = api.injectEndpoints({
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
    createProfile: builder.mutation<ApiProfile, Partial<ReturnType<typeof mapVCardDataToProfilePayload>>>({
      query: (body) => ({ url: '/profiles', method: 'POST', body }),
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
      invalidatesTags: (_r, _e, arg) => [
        { type: 'profiles', id: arg.id },
        { type: 'profiles', id: 'LIST' },
      ],
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
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
    }),
    replaceExperiences: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/experiences`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
    }),
    replaceServices: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/services`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
    }),
    replacePortfolios: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/portfolios`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
    }),
    replaceReviews: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/reviews`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
    }),
    replaceSkills: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/skills`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
    }),
    replaceSocialLinks: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/social-links`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
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
      invalidatesTags: (_r, _e, arg) => [
        { type: 'profiles', id: arg.id },
        { type: 'profiles', id: `${arg.id}:posts` },
      ],
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
      invalidatesTags: (_r, _e, arg) => [
        { type: 'profiles', id: arg.id },
        { type: 'profiles', id: `${arg.id}:posts` },
      ],
    }),
    deleteProfilePost: builder.mutation<{ id: string; deleted: boolean }, { id: string; postId: string }>({
      query: ({ id, postId }) => ({ url: `/profiles/${id}/posts/${postId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'profiles', id: arg.id },
        { type: 'profiles', id: `${arg.id}:posts` },
      ],
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
    getPackages: builder.query<unknown[], void>({
      query: () => '/profiles/packages',
      transformResponse: (res: Envelope<unknown[]>) => res.data || [],
    }),
    getSubscriptions: builder.query<unknown[], void>({
      query: () => '/profiles/subscriptions',
      transformResponse: (res: Envelope<unknown[]>) => res.data || [],
    }),
    getContacts: builder.query<ProfileContact[], string | void>({
      query: (profileId) =>
        profileId ? `/profiles/contacts?profileId=${encodeURIComponent(profileId)}` : '/profiles/contacts',
      transformResponse: (res: Envelope<ProfileContact[]>) => res.data || [],
      providesTags: ['dashboard'],
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
  useGetDashboardStatsQuery,
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
