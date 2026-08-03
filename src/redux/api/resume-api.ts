import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const RESUME_SECTION = 'Resume'

export const resumeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getResume: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(RESUME_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, RESUME_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Resume', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetResumeQuery, useLazyGetResumeQuery } = resumeApi
