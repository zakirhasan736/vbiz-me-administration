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
  zipCode?: string | null
  avatar?: string | null
  addresses?: Array<{
    id?: string
    city?: string | null
    state?: string | null
    zipCode?: string | null
    line1?: string | null
    isPrimary?: boolean
  }>
  prof?: string | null
  dob?: string | null
  template?: string
  isPublic?: boolean
  viewCount?: number
  createdAt?: string
  updatedAt?: string
  facebook?: string | null
  instagram?: string | null
  twitter?: string | null
  tiktok?: string | null
  youtube?: string | null
  linkedin?: string | null
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
  createdAt?: string
  updatedAt?: string
}

type Envelope<T> = { success: boolean; data: T; message?: string }

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

export type DashboardStats = {
  cards: number
  totalViews: number
  viewsLast30Days: number
  contactsLast30Days: number
  notesLast30Days: number
  guestsLast30Days: number
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
  const primaryAddress = profile.addresses?.find((a) => a.isPrimary) || profile.addresses?.[0] || null

  const { displaySettings, avatarImageUrl, explainerVideoUrl } = hydrateDisplaySettingsFromProfile({
    settings: profile.settings,
    attachments: profile.attachments,
    avatar: profile.avatar,
  })

  const data = createDefaultVCardData({
    slug: profile.slug || '',
    isPublic: profile.isPublic ?? true,
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
      state: primaryAddress?.state || '',
      city: primaryAddress?.city || '',
      zip: profile.zipCode || primaryAddress?.zipCode || '',
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
      url: p.url || '',
      active: p.status !== 0,
    })),
    skills: skillTagsToGroups(profile.skillTags),
    displaySettings,
  })

  return {
    ...data,
    id: profile.id,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
    views: profile.viewCount || 0,
    saves: 0,
    avatarImageUrl,
    isActive: true,
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
    zipCode: data.personal.zip ?? '',
    city: data.personal.city ?? '',
    state: data.personal.state ?? '',
    about: data.personal.about,
    prof: data.personal.profession,
    dob: dob || null,
    isPublic: data.isPublic,
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
  return /^(pf_|sk_|post_|faq_|svc_|sec_)/.test(id)
}

const profilesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfiles: builder.query<ApiProfile[], void>({
      query: () => '/profiles',
      transformResponse: (res: Envelope<ApiProfile[]>) => res.data || [],
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: 'profiles' as const, id: p.id })), { type: 'profiles' as const, id: 'LIST' }]
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
      invalidatesTags: [{ type: 'profiles', id: 'LIST' }, 'dashboard'],
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
      invalidatesTags: [{ type: 'profiles', id: 'LIST' }, 'dashboard'],
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
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/profiles/dashboard/stats',
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
    exportDashboardOverview: builder.mutation<Blob, void>({
      query: () => ({
        url: '/profiles/dashboard/export',
        method: 'GET',
        responseHandler: async (response: Response) => response.blob(),
      }),
    }),
    getPackages: builder.query<unknown[], void>({
      query: () => '/profiles/packages',
      transformResponse: (res: Envelope<unknown[]>) => res.data || [],
    }),
    getSubscriptions: builder.query<unknown[], void>({
      query: () => '/profiles/subscriptions',
      transformResponse: (res: Envelope<unknown[]>) => res.data || [],
    }),
    getContacts: builder.query<unknown[], string | void>({
      query: (profileId) =>
        profileId ? `/profiles/contacts?profileId=${encodeURIComponent(profileId)}` : '/profiles/contacts',
      transformResponse: (res: Envelope<unknown[]>) => res.data || [],
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
  useReplaceSkillsMutation,
  useReplaceSocialLinksMutation,
  useListProfilePostsQuery,
  useLazyListProfilePostsQuery,
  useCreateProfilePostMutation,
  useUpdateProfilePostMutation,
  useDeleteProfilePostMutation,
  useGetDashboardStatsQuery,
  useGetRecentEngagementQuery,
  useExportDashboardOverviewMutation,
  useGetPackagesQuery,
  useGetSubscriptionsQuery,
  useGetContactsQuery,
  useUploadMediaMutation,
} = profilesApi

export default profilesApi
