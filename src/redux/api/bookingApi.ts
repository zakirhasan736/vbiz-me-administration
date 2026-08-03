import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const BOOKING_SECTION = 'Booking'

export const bookingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBooking: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(BOOKING_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, BOOKING_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Booking', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetBookingQuery, useLazyGetBookingQuery } = bookingApi
