import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const MEDIA_PRESS_SECTION = 'Media Press'

export const mediaPressApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMediaPress: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(MEDIA_PRESS_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, MEDIA_PRESS_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'MediaPress', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetMediaPressQuery, useLazyGetMediaPressQuery } = mediaPressApi
