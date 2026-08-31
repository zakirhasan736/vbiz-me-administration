import { fetchPublicCardResponseWithOneRetry, getApiBaseUrl } from '@/lib/api/serverApi'
import type { MyCardData, MyCardResponse } from '@interfaces/api/myCard'
import { cache } from 'react'
import { enrichMyCardForSharePreview } from './enrichMyCardForSharePreview'
import {
  logPublicCardFetchFailure,
  PublicCardApiError,
  publicCardApiErrorFromStatus,
  publicCardRequestId,
} from './publicCardApiError'

async function loadMyCardBySlug(slug: string): Promise<MyCardData | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  const url = `${getApiBaseUrl()}/v/${encodeURIComponent(trimmed)}`
  let response: Response
  try {
    response = await fetchPublicCardResponseWithOneRetry(url)
  } catch (error) {
    if (error instanceof PublicCardApiError) throw error
    const wrapped = new PublicCardApiError('Failed to reach the public card API', 'NETWORK_ERROR', null)
    logPublicCardFetchFailure({ slug: trimmed, status: null, kind: wrapped.kind })
    throw wrapped
  }

  const requestId = publicCardRequestId(response)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const error = publicCardApiErrorFromStatus(response.status, requestId)
    logPublicCardFetchFailure({
      slug: trimmed,
      status: response.status,
      kind: error.kind,
      requestId,
    })
    throw error
  }

  let json: MyCardResponse
  try {
    json = (await response.json()) as MyCardResponse
  } catch {
    const error = new PublicCardApiError(
      'Public card API returned invalid JSON',
      'PARSE_ERROR',
      response.status,
      requestId
    )
    logPublicCardFetchFailure({
      slug: trimmed,
      status: response.status,
      kind: error.kind,
      requestId,
    })
    throw error
  }

  if (!json.success || !json.data) {
    const error = new PublicCardApiError(
      'Public card API returned an unexpected payload',
      'MALFORMED_PAYLOAD',
      response.status,
      requestId
    )
    logPublicCardFetchFailure({
      slug: trimmed,
      status: response.status,
      kind: error.kind,
      requestId,
    })
    throw error
  }

  return enrichMyCardForSharePreview(json.data)
}

/**
 * Fetches the full public profile payload for a slug.
 * Wrapped in React `cache` (RSC request scope only — not ISR / not persistent).
 */
export const fetchMyCardBySlug = cache(loadMyCardBySlug)
