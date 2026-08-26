import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'
import type { MyCardResponse } from '@interfaces/api/myCard'

/** Resolves a public profile id from a vCard slug (server-only). */
export async function fetchMyCardProfileId(slug: string): Promise<string | number | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  try {
    const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/v/${encodeURIComponent(trimmed)}`)

    if (!response.ok) return null

    const json = (await response.json()) as MyCardResponse
    if (!json.success || !json.data?.profile?.id) return null

    return json.data.profile.id
  } catch {
    return null
  }
}
