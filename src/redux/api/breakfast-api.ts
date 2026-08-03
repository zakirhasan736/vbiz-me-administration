import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const BREAKFAST_SECTION = 'Breakfast'

export const breakfastApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBreakfast: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(BREAKFAST_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, BREAKFAST_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Breakfast', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetBreakfastQuery, useLazyGetBreakfastQuery } = breakfastApi
