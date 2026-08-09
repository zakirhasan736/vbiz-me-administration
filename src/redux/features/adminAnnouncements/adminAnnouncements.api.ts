import { api } from '@/redux/api/api'
import type {
  Announcement,
  AnnouncementListPage,
  AnnouncementListQuery,
  ClearLiveAnnouncementResult,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '@/types/announcement'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

const adminAnnouncementsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<AnnouncementListPage, AnnouncementListQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('skip', String(params?.skip ?? 0))
        search.set('limit', String(params?.limit ?? 50))
        if (params?.status) search.set('status', params.status)
        if (params?.kind) search.set('kind', params.kind)
        return `/admin/announcements?${search.toString()}`
      },
      transformResponse: (res: Envelope<AnnouncementListPage>) => res.data,
      providesTags: (result) =>
        result
          ? [
              { type: 'adminAnnouncements' as const, id: 'LIST' },
              { type: 'adminAnnouncements' as const, id: 'ACTIVE' },
              ...result.items.map((a) => ({ type: 'adminAnnouncements' as const, id: a.id })),
            ]
          : [
              { type: 'adminAnnouncements' as const, id: 'LIST' },
              { type: 'adminAnnouncements' as const, id: 'ACTIVE' },
            ],
    }),
    getAnnouncement: builder.query<Announcement, string>({
      query: (id) => `/admin/announcements/${id}`,
      transformResponse: (res: Envelope<Announcement>) => res.data,
      providesTags: (_result, _error, id) => [{ type: 'adminAnnouncements', id }],
    }),
    getActiveAnnouncement: builder.query<Announcement | null, void>({
      query: () => '/announcements/active',
      transformResponse: (res: Envelope<Announcement | null>) => res.data,
      providesTags: [{ type: 'adminAnnouncements', id: 'ACTIVE' }],
    }),
    createAnnouncement: builder.mutation<Announcement, CreateAnnouncementPayload>({
      query: (body) => ({ url: '/admin/announcements', method: 'POST', body }),
      transformResponse: (res: Envelope<Announcement>) => res.data,
      invalidatesTags: [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
      ],
    }),
    updateAnnouncement: builder.mutation<Announcement, { id: string; body: UpdateAnnouncementPayload }>({
      query: ({ id, body }) => ({
        url: `/admin/announcements/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<Announcement>) => res.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
        { type: 'adminAnnouncements', id },
      ],
    }),
    deleteAnnouncement: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/admin/announcements/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
        { type: 'adminAnnouncements', id },
      ],
    }),
    clearLiveAnnouncement: builder.mutation<ClearLiveAnnouncementResult, void>({
      query: () => ({ url: '/admin/announcements/clear-live', method: 'POST' }),
      transformResponse: (res: Envelope<ClearLiveAnnouncementResult>) => res.data,
      invalidatesTags: [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
      ],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useGetAnnouncementQuery,
  useGetActiveAnnouncementQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useClearLiveAnnouncementMutation,
} = adminAnnouncementsApi

export default adminAnnouncementsApi
