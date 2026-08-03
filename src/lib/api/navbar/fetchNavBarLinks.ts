import type { NavBarLinksData, NavBarLinksResponse } from '@/interfaces/navbarLinks.interface'
import { getApiBaseUrl, SERVER_FETCH_REVALIDATE_SECONDS } from '@/lib/api/serverApi'

/** Fetches profile nav catalog from `GET /post-types?profile_id=` (server-only, ISR-cached). */
export async function fetchNavBarLinks(profileId: string | number): Promise<NavBarLinksData | null> {
  const id = String(profileId).trim()
  if (!id) return null

  try {
    const response = await fetch(`${getApiBaseUrl()}/post-types?profile_id=${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: SERVER_FETCH_REVALIDATE_SECONDS },
    })

    if (!response.ok) return null

    const json = (await response.json()) as NavBarLinksResponse
    if (!json.success || !json.data) return null

    return json.data
  } catch {
    return null
  }
}
