import type { MyCardTeamNotice } from '@/interfaces/api/myCard'
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
    getPublicProfileAnnouncement: build.query<Announcement | null, { profileId: string; visitorId?: string }>({
      query: ({ profileId, visitorId }) =>
        `/profiles/${encodeURIComponent(profileId.trim())}/announcement${
          visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : ''
        }`,
      transformResponse: (response: PublicEnvelope<Announcement | null>) => response?.data ?? null,
      providesTags: (_result, _error, { profileId }) => [{ type: 'PublicAnnouncement', id: profileId }],
      keepUnusedDataFor: 60,
    }),
    dismissPublicProfileAnnouncement: build.mutation<
      { id: string; dismissed: boolean },
      { profileId: string; announcementId: string; visitorId?: string }
    >({
      query: ({ profileId, announcementId, visitorId }) => ({
        url: `/profiles/${encodeURIComponent(profileId.trim())}/announcement/dismiss`,
        method: 'POST',
        body: { announcementId, visitorId },
      }),
      transformResponse: (response: PublicEnvelope<{ id: string; dismissed: boolean }>) => response?.data,
      invalidatesTags: (_result, _error, { profileId }) => [{ type: 'PublicAnnouncement', id: profileId }],
    }),
    getPublicProfileTeamNotice: build.query<
      MyCardTeamNotice | null,
      { profileId: string; visitorId?: string; origin?: 'admin' | 'owner' }
    >({
      query: ({ profileId, visitorId, origin }) => {
        const params = new URLSearchParams()
        if (visitorId) params.set('visitorId', visitorId)
        if (origin) params.set('origin', origin)
        const qs = params.toString()
        return `/profiles/${encodeURIComponent(profileId.trim())}/team-notices/active${qs ? `?${qs}` : ''}`
      },
      transformResponse: (response: PublicEnvelope<MyCardTeamNotice | null>) => response?.data ?? null,
      providesTags: (_result, _error, { profileId, origin }) => [
        { type: 'PublicAnnouncement', id: `team-notice:${origin || 'any'}:${profileId}` },
      ],
      keepUnusedDataFor: 60,
    }),
    dismissPublicProfileTeamNotice: build.mutation<
      { id: string; dismissed: boolean; suppressUntil: string },
      { profileId: string; noticeId: string; visitorId?: string }
    >({
      query: ({ profileId, noticeId, visitorId }) => ({
        url: `/profiles/${encodeURIComponent(profileId.trim())}/team-notices/${encodeURIComponent(noticeId)}/dismiss`,
        method: 'POST',
        body: { visitorId },
      }),
      transformResponse: (response: PublicEnvelope<{ id: string; dismissed: boolean; suppressUntil: string }>) =>
        response?.data,
      invalidatesTags: (_result, _error, { profileId }) => [
        { type: 'PublicAnnouncement', id: `team-notice:admin:${profileId}` },
        { type: 'PublicAnnouncement', id: `team-notice:owner:${profileId}` },
        { type: 'PublicAnnouncement', id: `team-notice:any:${profileId}` },
      ],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetPublicProfileAnnouncementQuery,
  useDismissPublicProfileAnnouncementMutation,
  useGetPublicProfileTeamNoticeQuery,
  useDismissPublicProfileTeamNoticeMutation,
} = publicAnnouncementsApi
