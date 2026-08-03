import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const EVENTS_SECTION = 'Events'

export const eventsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEvents: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(EVENTS_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, EVENTS_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Events', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetEventsQuery, useLazyGetEventsQuery } = eventsApi
