import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const CERTIFICATIONS_LICENSING_SECTION = 'Certificates Licenses'

export const certificationsLicensingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCertificationsLicensing: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(CERTIFICATIONS_LICENSING_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, CERTIFICATIONS_LICENSING_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'CertificationsLicensing', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetCertificationsLicensingQuery, useLazyGetCertificationsLicensingQuery } = certificationsLicensingApi
