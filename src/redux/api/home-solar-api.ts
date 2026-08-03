import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const HOME_SOLAR_SECTION = 'Home Solar'

export const homeSolarApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHomeSolar: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(HOME_SOLAR_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, HOME_SOLAR_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'HomeSolar', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetHomeSolarQuery, useLazyGetHomeSolarQuery } = homeSolarApi
