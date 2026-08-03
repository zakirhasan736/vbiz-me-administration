import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

export const blogApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBlog: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) => `/dynamic-section/blog?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) => normalizeDynamicPostsResponse(response, 'Blog'),
      providesTags: (_result, _error, profileId) => [{ type: 'Blog', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetBlogQuery, useLazyGetBlogQuery } = blogApi
