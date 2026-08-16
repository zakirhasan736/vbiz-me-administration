import { publicApi as api } from '@/redux/api/publicApi'
import type { Announcement } from '@/types/announcement'

type PublicEnvelope<T> = {
  success: boolean
  data: T
  error?: string
}

export const publicAnnouncementsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Live banner for a public card when meta.showPublic is set. */
    getPublicProfileAnnouncement: build.query<Announcement | null, string>({
      query: (profileId) => `/profiles/${encodeURIComponent(profileId.trim())}/announcement`,
      transformResponse: (response: PublicEnvelope<Announcement | null>) => response?.data ?? null,
      providesTags: (_result, _error, profileId) => [{ type: 'PublicAnnouncement', id: profileId }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
})

export const { useGetPublicProfileAnnouncementQuery } = publicAnnouncementsApi
