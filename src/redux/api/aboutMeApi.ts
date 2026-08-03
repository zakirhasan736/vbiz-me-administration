import type { AboutMeQueryResult, AboutMeSectionResponse } from '@/interfaces/api/aboutMe.interface'
import { normalizeAboutMeResponse } from '@/lib/api/aboutMe/mapAboutMe'
import { publicApi as api } from './publicApi'

const ABOUT_ME_SECTION = 'About Me'

export const aboutMeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAboutMe: build.query<AboutMeQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(ABOUT_ME_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: AboutMeSectionResponse) => normalizeAboutMeResponse(response),
      providesTags: (_result, _error, profileId) => [{ type: 'AboutMe', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAboutMeQuery, useLazyGetAboutMeQuery } = aboutMeApi
