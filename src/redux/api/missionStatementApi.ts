import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const MISSION_STATEMENT_SECTION = 'Mission Statement'

export const missionStatementApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMissionStatement: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(MISSION_STATEMENT_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, MISSION_STATEMENT_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'MissionStatement', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetMissionStatementQuery, useLazyGetMissionStatementQuery } = missionStatementApi
