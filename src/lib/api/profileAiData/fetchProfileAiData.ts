import { normalizeProfileAiData } from '@/lib/api/profileAiData/normalizeProfileAiData'
import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'
import type { ProfileAiData } from '@interfaces/api/profileAiData'

export async function fetchProfileAiData(profileId: number | string): Promise<ProfileAiData | null> {
  const id = String(profileId).trim()
  if (!id) return null

  try {
    const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/profile-ai-data/${encodeURIComponent(id)}`)

    if (!response.ok) return null

    const data = normalizeProfileAiData(await response.json())
    return data ? { ...data, profileId: data.profileId || id } : null
  } catch {
    return null
  }
}
