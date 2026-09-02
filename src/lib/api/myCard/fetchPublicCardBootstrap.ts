import type { ProfileSettingsData } from '@/interfaces/api/profileSettings.interface'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import { fetchPublicCardResponseWithOneRetry, getApiBaseUrl } from '@/lib/api/serverApi'
import type { MyCardData } from '@interfaces/api/myCard'
import { cache } from 'react'
import { enrichMyCardForSharePreview } from './enrichMyCardForSharePreview'
import {
  logPublicCardFetchFailure,
  PublicCardApiError,
  publicCardApiErrorFromStatus,
  publicCardRequestId,
} from './publicCardApiError'

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
 * One SSR request for card + nav catalog + theme settings (+ light section payloads).
 * Replaces multiple parallel GETs that shared one rate-limit bucket.
 */
export const fetchPublicCardBootstrap = cache(loadPublicCardBootstrap)
