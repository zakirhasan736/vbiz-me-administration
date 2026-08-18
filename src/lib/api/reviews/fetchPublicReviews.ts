import type { ReviewsQueryResult, ReviewsSectionResponse } from '@/interfaces/api/reviews.interface'
import { normalizeReviewsResponse } from '@/lib/api/reviews/mapReviews'
import { getApiBaseUrl, PUBLIC_CARD_FETCH_INIT } from '@/lib/api/serverApi'

/** Public reviews for JSON-LD only. Empty when the card has none — never invented. */
export async function fetchPublicReviews(profileId: string): Promise<ReviewsQueryResult | null> {
  const id = profileId.trim()
  if (!id) return null

  try {
    const response = await fetch(`${getApiBaseUrl()}/dynamic-section/reviews?profile_id=${encodeURIComponent(id)}`, {
      ...PUBLIC_CARD_FETCH_INIT,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const json = (await response.json()) as ReviewsSectionResponse
    if (!json.success || !json.data) return null
    return normalizeReviewsResponse(json)
  } catch {
    return null
  }
}
