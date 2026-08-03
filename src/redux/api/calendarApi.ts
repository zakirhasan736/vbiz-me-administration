import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

export const calendarApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCalendar: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) => `/dynamic-section/calender?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) => normalizeDynamicPostsResponse(response, 'Calendar'),
      providesTags: (_result, _error, profileId) => [{ type: 'Calendar', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetCalendarQuery, useLazyGetCalendarQuery } = calendarApi
