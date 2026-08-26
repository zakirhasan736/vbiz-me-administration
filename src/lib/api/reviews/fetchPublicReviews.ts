import type { ReviewsQueryResult, ReviewsSectionResponse } from '@/interfaces/api/reviews.interface'
import { normalizeReviewsResponse } from '@/lib/api/reviews/mapReviews'
import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'

/** Public reviews for JSON-LD only. Empty when the card has none — never invented. */
export async function fetchPublicReviews(profileId: string): Promise<ReviewsQueryResult | null> {
  const id = profileId.trim()
  if (!id) return null

  try {
    const response = await fetchPublicCardResponse(
      `${getApiBaseUrl()}/dynamic-section/reviews?profile_id=${encodeURIComponent(id)}`
    )
    if (!response.ok) return null
    const json = (await response.json()) as ReviewsSectionResponse
    if (!json.success || !json.data) return null
    return normalizeReviewsResponse(json)
  } catch {
    return null
  }
}
