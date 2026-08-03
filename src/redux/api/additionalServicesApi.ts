import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const ADDITIONAL_SERVICES_SECTION = 'Additional Services'

export const additionalServicesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdditionalServices: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(ADDITIONAL_SERVICES_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, 'Additional Services'),
      providesTags: (_result, _error, profileId) => [{ type: 'AdditionalServices', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAdditionalServicesQuery, useLazyGetAdditionalServicesQuery } = additionalServicesApi
