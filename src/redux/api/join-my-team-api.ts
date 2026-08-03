import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const JOIN_MY_TEAM_SECTION = 'Join My Team'

export const joinMyTeamApi = api.injectEndpoints({
  endpoints: (build) => ({
    getJoinMyTeam: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(JOIN_MY_TEAM_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, JOIN_MY_TEAM_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'JoinMyTeam', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetJoinMyTeamQuery, useLazyGetJoinMyTeamQuery } = joinMyTeamApi
