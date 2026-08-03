import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const WHY_CHOOSE_US_SECTION = 'Why Choose Us'

export const whyChooseUsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getWhyChooseUs: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(WHY_CHOOSE_US_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, WHY_CHOOSE_US_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'WhyChooseUs', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetWhyChooseUsQuery, useLazyGetWhyChooseUsQuery } = whyChooseUsApi
