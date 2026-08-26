import type { ProfileSettingsResponse } from '@/interfaces/api/profileSettings.interface'
import {
  brandColorsFromThemeConfig,
  mapProfileSettings,
  type MappedProfileSettings,
} from '@/lib/api/profileSettings/mapProfileSettings'
import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'

/** Fetches `GET /profiles/{id}/settings` (theme + appearance). */
export async function fetchProfileSettings(profileId: string | number): Promise<ProfileSettingsResponse | null> {
  const id = String(profileId).trim()
  if (!id) return null

  try {
    const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/profiles/${encodeURIComponent(id)}/settings`)

    if (!response.ok) return null
    return (await response.json()) as ProfileSettingsResponse
  } catch {
    return null
  }
}

/** Fetch + map settings onto template defaults. */
export async function resolveProfileSettingsTheme(
  profileId: string | number,
  template: ProfileTemplateId = 'v3'
): Promise<MappedProfileSettings | null> {
  const raw = await fetchProfileSettings(profileId)
  if (!raw) return null
  return mapProfileSettings(raw, template)
}

export { brandColorsFromThemeConfig, mapProfileSettings }
