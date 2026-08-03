import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const LICENSING_SECTION = 'Licensing'

export const licensingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getLicensing: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(LICENSING_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, LICENSING_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Licensing', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetLicensingQuery, useLazyGetLicensingQuery } = licensingApi
