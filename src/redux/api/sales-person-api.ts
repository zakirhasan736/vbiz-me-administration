import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const SALES_PERSON_SECTION = 'Sales Person'

export const salesPersonApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSalesPerson: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(SALES_PERSON_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, SALES_PERSON_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'SalesPerson', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetSalesPersonQuery, useLazyGetSalesPersonQuery } = salesPersonApi
