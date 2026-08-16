import type { ReviewsQueryResult } from '@/interfaces/api/reviews.interface'
import { normalizeReviewsResponse } from '@/lib/api/reviews/mapReviews'
import { publicApi as api } from '@/redux/api/publicApi'

export const reviewsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReviews: build.query<ReviewsQueryResult, string>({
      query: (profileId) => `/dynamic-section/reviews?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: normalizeReviewsResponse,
      providesTags: (_result, _error, profileId) => [{ type: 'Reviews', id: profileId }],
    }),
  }),
  overrideExisting: true,
})

export const { useGetReviewsQuery, useLazyGetReviewsQuery } = reviewsApi
