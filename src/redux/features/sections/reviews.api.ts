import type { ReviewsQueryResult, ReviewsSectionResponse } from '@/interfaces/api/reviews.interface'
import { reportPublicSectionMedia } from '@/lib/api/reportPublicSectionMedia'
import { normalizeReviewsResponse } from '@/lib/api/reviews/mapReviews'
import { publicApi as api } from '@/redux/api/publicApi'

export const reviewsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReviews: build.query<ReviewsQueryResult, string>({
      query: (profileId) => `/dynamic-section/reviews?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: ReviewsSectionResponse) => {
        const mapped = normalizeReviewsResponse(response)
        reportPublicSectionMedia('reviews', response, mapped)
        return mapped
      },
      providesTags: (_result, _error, profileId) => [{ type: 'Reviews', id: profileId }],
    }),
  }),
  overrideExisting: true,
})

export const { useGetReviewsQuery, useLazyGetReviewsQuery } = reviewsApi
