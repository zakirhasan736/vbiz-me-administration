import { getApiBaseUrl, SERVER_FETCH_REVALIDATE_SECONDS } from '@/lib/api/serverApi'
import type { ProfileAiData } from '@interfaces/api/profileAiData'

export async function fetchProfileAiData(profileId: number | string): Promise<ProfileAiData | null> {
  const id = String(profileId).trim()
  if (!id) return null

  try {
    const response = await fetch(`${getApiBaseUrl()}/profile-ai-data/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: SERVER_FETCH_REVALIDATE_SECONDS },
    })

    if (!response.ok) return null

    return (await response.json()) as ProfileAiData
  } catch {
    return null
  }
}
