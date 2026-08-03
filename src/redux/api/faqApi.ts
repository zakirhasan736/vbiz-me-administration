import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const FAQ_SECTION = 'Faq'

export const faqApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFaq: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(FAQ_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, FAQ_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Faq', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetFaqQuery, useLazyGetFaqQuery } = faqApi
