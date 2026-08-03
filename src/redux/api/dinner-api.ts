import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const DINNER_SECTION = 'Dinner'

export const dinnerApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDinner: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(DINNER_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, DINNER_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Dinner', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetDinnerQuery, useLazyGetDinnerQuery } = dinnerApi
