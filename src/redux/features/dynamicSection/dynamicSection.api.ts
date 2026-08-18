import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { reportPublicSectionMedia } from '@/lib/api/reportPublicSectionMedia'
import { publicApi as api } from '@/redux/api/publicApi'

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
      transformResponse: (response: DynamicPostsSectionResponse, _meta, arg) => {
        const mapped = normalizeDynamicPostsResponse(response, arg.sectionName)
        if (/clients|gallery|review|video/i.test(arg.sectionName)) {
          reportPublicSectionMedia(arg.sectionName, response, mapped)
        }
        return mapped
      },
      providesTags: (_result, _error, arg) => [{ type: 'DynamicSection', id: `${arg.profileId}:${arg.sectionName}` }],
    }),
  }),
  overrideExisting: true,
})

export const { useGetDynamicSectionQuery, useLazyGetDynamicSectionQuery } = dynamicSectionApi
