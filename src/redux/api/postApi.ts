import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const POST_SECTION = 'Post'

export const postApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPosts: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(POST_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, POST_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Post', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetPostsQuery, useLazyGetPostsQuery } = postApi
