import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const INSURANCE_LICENSE_SECTION = 'Insurance License'

export const insuranceLicenseApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInsuranceLicense: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(INSURANCE_LICENSE_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, INSURANCE_LICENSE_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'InsuranceLicense', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetInsuranceLicenseQuery, useLazyGetInsuranceLicenseQuery } = insuranceLicenseApi
