import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const DCP_SECTION = 'Department of Consumer Protection (DCP)'

export const dcpApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDcp: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(DCP_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, DCP_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Dcp', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetDcpQuery, useLazyGetDcpQuery } = dcpApi
