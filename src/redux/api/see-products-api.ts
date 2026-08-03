import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const SEE_PRODUCTS_SECTION = 'See Products'

export const seeProductsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSeeProducts: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(SEE_PRODUCTS_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, SEE_PRODUCTS_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'SeeProducts', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetSeeProductsQuery, useLazyGetSeeProductsQuery } = seeProductsApi
