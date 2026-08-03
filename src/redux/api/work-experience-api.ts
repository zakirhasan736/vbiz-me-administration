import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const WORK_EXPERIENCE_SECTION = 'Work Experience'

export const workExperienceApi = api.injectEndpoints({
  endpoints: (build) => ({
    getWorkExperience: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(WORK_EXPERIENCE_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, WORK_EXPERIENCE_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'WorkExperience', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetWorkExperienceQuery, useLazyGetWorkExperienceQuery } = workExperienceApi
