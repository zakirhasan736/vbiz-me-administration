import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const MEET_OUR_TEAM_SECTION = 'Meet Our Team'

export const meetOurTeamApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMeetOurTeam: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(MEET_OUR_TEAM_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, MEET_OUR_TEAM_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'MeetOurTeam', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetMeetOurTeamQuery, useLazyGetMeetOurTeamQuery } = meetOurTeamApi
