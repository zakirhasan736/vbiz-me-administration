import type { NavBarLinksData, NavBarLinksResponse } from '@/interfaces/navbarLinks.interface'
import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'

/** Fetches profile nav catalog from `GET /post-types?profile_id=` (never ISR-cached). */
export async function fetchNavBarLinks(profileId: string | number): Promise<NavBarLinksData | null> {
  const id = String(profileId).trim()
  if (!id) return null

  try {
    const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/post-types?profile_id=${encodeURIComponent(id)}`)

    if (!response.ok) return null

    const json = (await response.json()) as NavBarLinksResponse
    if (!json.success || !json.data) return null

    return json.data
  } catch {
    return null
  }
}
