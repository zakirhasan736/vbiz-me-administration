import { getApiBaseUrl, PUBLIC_CARD_FETCH_INIT } from '@/lib/api/serverApi'
import type { MyCardData, MyCardResponse } from '@interfaces/api/myCard'
import { cache } from 'react'
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
    response = await fetch(url, {
      ...PUBLIC_CARD_FETCH_INIT,
      headers: {
        Accept: 'application/json',
      },
    })
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

  return json.data
}

/**
 * Fetches the full public profile payload for a slug.
 * Wrapped in React `cache` (RSC request scope only — not ISR / not persistent).
 * Next.js also memoizes identical GET `fetch` calls during a Server Component render pass,
 * including `cache: 'no-store'`. That memoization does not apply to Route Handlers
 * (manifest / icons / wallet-art). `generateMetadata` is not listed in Next's fetch
 * memoization docs; React `cache` is what shares metadata + page within one document request.
 */
export const fetchMyCardBySlug = cache(loadMyCardBySlug)
