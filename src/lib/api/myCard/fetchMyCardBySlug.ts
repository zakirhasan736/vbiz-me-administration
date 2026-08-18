import { getApiBaseUrl } from '@/lib/api/serverApi'
import type { MyCardData, MyCardResponse } from '@interfaces/api/myCard'

/** Fetches the full public profile payload for a slug (never ISR-cached). */
export async function fetchMyCardBySlug(slug: string): Promise<MyCardData | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  try {
    const response = await fetch(`${getApiBaseUrl()}/v/${encodeURIComponent(trimmed)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) return null

    const json = (await response.json()) as MyCardResponse
    if (!json.success || !json.data) return null

    return json.data
  } catch {
    return null
  }
}
