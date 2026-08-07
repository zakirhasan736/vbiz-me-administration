import type { ProfileAiData } from '@/interfaces/api/profileAiData'
import { normalizeProfileAiData } from '@/lib/api/profileAiData/normalizeProfileAiData'
import { publicApi as api } from '@/redux/api/publicApi'

export const profileAiDataApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProfileAiData: build.query<ProfileAiData, string>({
      query: (profileId) => `/profile-ai-data/${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: unknown) => {
        const normalized = normalizeProfileAiData(response)
        if (!normalized) {
          throw new Error('Invalid profile-ai-data response')
        }
        return normalized
      },
      providesTags: (_result, _error, profileId) => [{ type: 'ProfileAiData', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetProfileAiDataQuery, useLazyGetProfileAiDataQuery } = profileAiDataApi
