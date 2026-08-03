import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const BBB_ACCREDITATION_SECTION = 'Better Business Bureau (BBB) Accreditation'

export const bbbAccreditationApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBbbAccreditation: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(BBB_ACCREDITATION_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, BBB_ACCREDITATION_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'BbbAccreditation', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetBbbAccreditationQuery, useLazyGetBbbAccreditationQuery } = bbbAccreditationApi
