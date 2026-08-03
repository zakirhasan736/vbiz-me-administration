import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const RESILIENCY_PRODUCTS_SECTION = 'Resiliency Products'

export const resiliencyProductsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getResiliencyProducts: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(RESILIENCY_PRODUCTS_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, RESILIENCY_PRODUCTS_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'ResiliencyProducts', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetResiliencyProductsQuery, useLazyGetResiliencyProductsQuery } = resiliencyProductsApi
