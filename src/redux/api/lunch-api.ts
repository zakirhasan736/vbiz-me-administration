import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const LUNCH_SECTION = 'Lunch'

export const lunchApi = api.injectEndpoints({
  endpoints: (build) => ({
    getLunch: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(LUNCH_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, LUNCH_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Lunch', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetLunchQuery, useLazyGetLunchQuery } = lunchApi
