import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

export type DynamicSectionQueryArg = {
  profileId: string
  /** Exact nav/post-type `name` from `/post-types` (e.g. "Licensing", "Resume"). */
  sectionName: string
}

export const dynamicSectionApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDynamicSection: build.query<DynamicPostsQueryResult, DynamicSectionQueryArg>({
      query: ({ profileId, sectionName }) =>
        `/dynamic-section/${encodeURIComponent(sectionName.trim())}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse, _meta, arg) =>
        normalizeDynamicPostsResponse(response, arg.sectionName),
      providesTags: (_result, _error, arg) => [{ type: 'DynamicSection', id: `${arg.profileId}:${arg.sectionName}` }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetDynamicSectionQuery, useLazyGetDynamicSectionQuery } = dynamicSectionApi
