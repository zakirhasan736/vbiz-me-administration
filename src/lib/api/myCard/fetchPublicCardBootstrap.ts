import type { ProfileSettingsData } from '@/interfaces/api/profileSettings.interface'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import { describeFetchError, fetchPublicCardResponseWithOneRetry, getApiBaseUrl } from '@/lib/api/serverApi'
import type { MyCardData } from '@interfaces/api/myCard'
import { cache } from 'react'
import { enrichMyCardForSharePreview } from './enrichMyCardForSharePreview'
import {
  logPublicCardFetchFailure,
  PublicCardApiError,
  publicCardApiErrorFromStatus,
  publicCardRequestId,
} from './publicCardApiError'
import {
  forgetPublicCardBootstrap,
  recallPublicCardBootstrap,
  rememberPublicCardBootstrap,
} from './publicCardBootstrapFallback'

export type PublicCardBootstrapPayload = {
  myCard: MyCardData
  postTypes: NavBarLinksData
  settings: ProfileSettingsData
  sections: Record<string, unknown>
}

type BootstrapApiResponse = {
  success: boolean
  data?: PublicCardBootstrapPayload
  error?: string
}

async function loadPublicCardBootstrap(slug: string): Promise<PublicCardBootstrapPayload | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  const url = `${getApiBaseUrl()}/v/${encodeURIComponent(trimmed)}/bootstrap`
  let response: Response
  try {
    response = await fetchPublicCardResponseWithOneRetry(url)
  } catch (error) {
    if (error instanceof PublicCardApiError) throw error
    const wrapped = new PublicCardApiError('Failed to reach the public card API', 'NETWORK_ERROR', null)
    logPublicCardFetchFailure({
      slug: trimmed,
      status: null,
      kind: wrapped.kind,
      cause: describeFetchError(error),
    })
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

  let json: BootstrapApiResponse
  try {
    json = (await response.json()) as BootstrapApiResponse
  } catch {
    const error = new PublicCardApiError(
      'Public card bootstrap API returned invalid JSON',
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

  if (!json.success || !json.data?.myCard) {
    const error = new PublicCardApiError(
      'Public card bootstrap API returned an unexpected payload',
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

  return {
    ...json.data,
    myCard: await enrichMyCardForSharePreview(json.data.myCard),
  }
}

/**
 * Live fetch with a last-known-good fallback. If the API is rate-limited, slow, or unreachable,
 * serve the most recent copy of this card instead of letting the page soft-fail to an empty
 * shell (which is what search engines were indexing as a blank page during crawl bursts).
 */
async function loadPublicCardBootstrapWithFallback(slug: string): Promise<PublicCardBootstrapPayload | null> {
  try {
    const live = await loadPublicCardBootstrap(slug)
    if (live) {
      rememberPublicCardBootstrap(slug, live)
    } else {
      forgetPublicCardBootstrap(slug)
    }
    return live
  } catch (error) {
    const stale = recallPublicCardBootstrap<PublicCardBootstrapPayload>(slug)
    if (stale) {
      console.warn('[fetchPublicCardBootstrap] serving last-known-good card after API failure', {
        slug: slug.trim(),
        kind: error instanceof PublicCardApiError ? error.kind : 'UNKNOWN',
        status: error instanceof PublicCardApiError ? error.status : null,
      })
      return stale
    }
    throw error
  }
}

/**
 * One SSR request for card + nav catalog + theme settings (+ light section payloads).
 * Replaces multiple parallel GETs that shared one rate-limit bucket.
 */
export const fetchPublicCardBootstrap = cache(loadPublicCardBootstrapWithFallback)
