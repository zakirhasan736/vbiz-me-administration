import type { AboutMeQueryResult, AboutMeSectionResponse } from '@/interfaces/api/aboutMe.interface'
import { normalizeAboutMeResponse } from '@/lib/api/aboutMe/mapAboutMe'
import { TAB_REGISTRY } from '@/lib/tabRegistry'
import { api } from '@/redux/api/api'
import { publicApi } from '@/redux/api/publicApi'

const ABOUT_ME_SECTION = TAB_REGISTRY.about_me.publicSectionName

export type ProfileAboutMeRecord = {
  id: string
  profileId: string
  title: string
  description: string | null
  featuredMediaUrl: string | null
  featuredMediaFocusY: number | null
  status: string
  legacyPostId: number | null
  createdAt: string
  updatedAt: string
}

export type UpsertAboutMeBody = {
  title: string
  description: string
  featuredMediaUrl: string
  featuredMediaFocusY?: number | null
  status?: string
}

type Envelope<T> = { success: boolean; data: T; message?: string }

/** Public About Me section (dynamic-section bridged to AboutMe table). */
export const aboutMeApi = publicApi.injectEndpoints({
  endpoints: (build) => ({
    getAboutMe: build.query<AboutMeQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(ABOUT_ME_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: AboutMeSectionResponse) => normalizeAboutMeResponse(response),
      providesTags: (_result, _error, profileId) => [{ type: 'AboutMe', id: profileId }],
    }),
  }),
  overrideExisting: true,
})

/** Authenticated profile About Me CRUD. */
export const aboutMeAuthApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProfileAboutMe: build.query<ProfileAboutMeRecord | null, string>({
      query: (id) => `/profiles/${id}/about-me`,
      transformResponse: (res: Envelope<ProfileAboutMeRecord | null>) => res.data ?? null,
    }),
    upsertAboutMe: build.mutation<ProfileAboutMeRecord, { id: string; body: UpsertAboutMeBody }>({
      query: ({ id, body }) => ({
        url: `/profiles/${id}/about-me`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res: Envelope<ProfileAboutMeRecord>) => res.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(aboutMeAuthApi.util.upsertQueryData('getProfileAboutMe', id, data))
          dispatch(publicApi.util.invalidateTags([{ type: 'AboutMe', id }, 'DynamicSection', 'NavBarLinks']))
        } catch {
          /* mutation error surfaces via RTK */
        }
      },
    }),
  }),
  overrideExisting: true,
})

export const { useGetAboutMeQuery, useLazyGetAboutMeQuery } = aboutMeApi
export const { useGetProfileAboutMeQuery, useUpsertAboutMeMutation } = aboutMeAuthApi
