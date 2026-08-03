import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const VIDEO_LINKS_SECTION = 'Video Links'

export const videoLinksApi = api.injectEndpoints({
  endpoints: (build) => ({
    getVideoLinks: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(VIDEO_LINKS_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, VIDEO_LINKS_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'VideoLinks', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetVideoLinksQuery, useLazyGetVideoLinksQuery } = videoLinksApi
