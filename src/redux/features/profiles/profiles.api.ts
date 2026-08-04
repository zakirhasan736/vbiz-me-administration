import { api } from '@/redux/api/api'
import type { VCardData, VCardRecord } from '@/types/vcard'
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
  prof?: string | null
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
  }>
  portfolios?: Array<{
    id: string
    title?: string | null
    description?: string | null
    url?: string | null
    imageUrl?: string | null
  }>
  socialLinks?: Array<{ id: string; name?: string | null; url?: string | null; icon?: string | null }>
  profileSettings?: {
    profileTemplate?: string
    layoutStyle?: string | null
    buttonStyle?: string | null
    cornerStyle?: string | null
  } | null
}

type Envelope<T> = { success: boolean; data: T; message?: string }

const templateToAppearance = (template?: string) => {
  if (template === 'dynamic' || template === 'v1') return 'v1' as const
  if (template === 'classic' || template === 'v2') return 'v2' as const
  return 'v3' as const
}

export function mapApiProfileToVCardRecord(profile: ApiProfile): VCardRecord {
  const data = createDefaultVCardData({
    slug: profile.slug || '',
    isPublic: profile.isPublic ?? true,
    personal: {
      fullName: profile.name,
      email: profile.email,
      dob: '',
      gender: 'Male',
      relationship: 'Single',
      profession: profile.prof || '',
      designation: profile.designation || '',
      company: profile.companyName || '',
      phone: profile.phone || '',
      whatsapp: profile.whatsapp || '',
      address: profile.address || '',
      website: profile.website || '',
      about: profile.about || '',
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
      fromDate: e.fromDate ? String(e.fromDate).slice(0, 10) : '',
      toDate: e.toDate ? String(e.toDate).slice(0, 10) : '',
      tillNow: Boolean(e.tillNow),
    })),
    experience: (profile.experiences || []).map((e) => ({
      id: e.id,
      company: e.company || '',
      jobTitle: e.jobTitle || '',
      description: e.description || '',
      fromDate: e.fromDate ? String(e.fromDate).slice(0, 10) : '',
      toDate: e.toDate ? String(e.toDate).slice(0, 10) : '',
      tillNow: Boolean(e.tillNow),
    })),
    services: (profile.services || []).map((s) => ({
      id: s.id,
      type: 'Service',
      title: s.title || '',
      description: s.description || '',
      url: s.reviewUrl || '',
      featuredImage: s.imageUrl || '',
      active: true,
    })),
  })

  return {
    ...data,
    id: profile.id,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
    views: profile.viewCount || 0,
    saves: 0,
    avatarImageUrl: profile.avatar || '',
    isActive: true,
  }
}

export function mapVCardDataToProfilePayload(data: VCardData) {
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
    isPublic: data.isPublic,
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
    profileSettings: data.appearance
      ? {
          profileTemplate: data.appearance.profileTemplate,
          layoutStyle: data.appearance.layoutStyle,
          buttonStyle: data.appearance.buttonStyle,
          cornerStyle: data.appearance.cornerStyle,
        }
      : undefined,
  }
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
    replaceSocialLinks: builder.mutation<ApiProfile, { id: string; items: unknown[] }>({
      query: ({ id, items }) => ({ url: `/profiles/${id}/social-links`, method: 'PUT', body: { items } }),
      transformResponse: (res: Envelope<ApiProfile>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: 'profiles', id: arg.id }],
    }),
    getDashboardStats: builder.query<
      {
        cards: number
        totalViews: number
        viewsLast30Days: number
        contactsLast30Days: number
        notesLast30Days: number
        guestsLast30Days: number
      },
      void
    >({
      query: () => '/profiles/dashboard/stats',
      transformResponse: (
        res: Envelope<{
          cards: number
          totalViews: number
          viewsLast30Days: number
          contactsLast30Days: number
          notesLast30Days: number
          guestsLast30Days: number
        }>
      ) => res.data,
      providesTags: ['dashboard'],
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

export const {
  useGetProfilesQuery,
  useGetProfileQuery,
  useCreateProfileMutation,
  useUpdateProfileCardMutation,
  useDeleteProfileMutation,
  useReplaceEducationMutation,
  useReplaceExperiencesMutation,
  useReplaceServicesMutation,
  useReplacePortfoliosMutation,
  useReplaceSocialLinksMutation,
  useGetDashboardStatsQuery,
  useGetPackagesQuery,
  useGetSubscriptionsQuery,
  useGetContactsQuery,
  useUploadMediaMutation,
} = profilesApi

export default profilesApi
