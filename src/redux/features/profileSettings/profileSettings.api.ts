import type { ProfileSettingsResponse } from '@/interfaces/api/profileSettings.interface'
import { mapProfileSettings, type MappedProfileSettings } from '@/lib/api/profileSettings/mapProfileSettings'
import { publicApi as api } from '@/redux/api/publicApi'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'

export type ProfileSettingsQueryArg = {
  profileId: string
  template: ProfileTemplateId
}

export const profileSettingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Live theme from `GET /profiles/{id}/settings` — refetches so editor changes apply. */
    getProfileSettings: build.query<MappedProfileSettings, ProfileSettingsQueryArg>({
      query: ({ profileId }) => `/profiles/${encodeURIComponent(profileId.trim())}/settings`,
      transformResponse: (response: ProfileSettingsResponse, _meta, arg) => mapProfileSettings(response, arg.template),
      providesTags: (_result, _error, arg) => [{ type: 'ProfileSettings', id: arg.profileId }],
      keepUnusedDataFor: 120,
    }),
  }),
  overrideExisting: true,
})

export const { useGetProfileSettingsQuery, useLazyGetProfileSettingsQuery } = profileSettingsApi
