import { normalizeProfileAiData } from '@/lib/api/profileAiData/normalizeProfileAiData'
import { getApiBaseUrl } from '@/lib/api/serverApi'
import type { ProfileAiData } from '@interfaces/api/profileAiData'

export async function fetchProfileAiData(profileId: number | string): Promise<ProfileAiData | null> {
  const id = String(profileId).trim()
  if (!id) return null

  try {
    const response = await fetch(`${getApiBaseUrl()}/profile-ai-data/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) return null

    return normalizeProfileAiData(await response.json())
  } catch {
    return null
  }
}
