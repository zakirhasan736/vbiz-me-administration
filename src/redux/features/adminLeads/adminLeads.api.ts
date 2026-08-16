import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
  totalDoc?: number
}

export type AdminLeadMetadata = {
  userAgent: string
  language: string
  platform: string
  browser: string
  device: string
  screen: string
  timezone: string
  approximateLocation: string
  referrer: string
}

export type AdminLeadRow = {
  id: string
  fullName: string
  phoneNumber: string
  email: string
  guestMessage?: string
  privateNotes?: string
  lastReply?: string
  lastReplyAt?: string
  submittedAt: string
  vCardId: string
  vCardSlug: string
  vCardName: string
  ownerId: string
  ownerName: string
  kind: 'guest_save' | 'guest_message'
  consent: boolean
  metadata: AdminLeadMetadata
}

export type AdminLeadsStats = {
  totalSaves: number
  sourceProfiles: number
  totalNotes: number
  storage: 'api'
}

export type AdminLeadsListQuery = {
  q?: string
  profileId?: string
}

export type PatchAdminLeadBody = {
  privateNotes?: string
  lastReply?: string
}

function buildListSearch(params?: AdminLeadsListQuery) {
  const search = new URLSearchParams()
  if (params?.q?.trim()) search.set('q', params.q.trim())
  if (params?.profileId?.trim()) search.set('profileId', params.profileId.trim())
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

const adminLeadsApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminLeadsStats: builder.query<AdminLeadsStats, void>({
      query: () => '/admin/leads/stats',
      transformResponse: (res: Envelope<AdminLeadsStats>) => res.data,
      providesTags: [{ type: 'adminLeads', id: 'STATS' }],
    }),
    getAdminLeadsSaves: builder.query<AdminLeadRow[], AdminLeadsListQuery | void>({
      query: (params) => `/admin/leads/saves${buildListSearch(params || undefined)}`,
      transformResponse: (res: Envelope<AdminLeadRow[]>) => res.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((row) => ({ type: 'adminLeads' as const, id: `save-${row.id}` })),
              { type: 'adminLeads', id: 'SAVES' },
            ]
          : [{ type: 'adminLeads', id: 'SAVES' }],
    }),
    getAdminLeadsNotes: builder.query<AdminLeadRow[], AdminLeadsListQuery | void>({
      query: (params) => `/admin/leads/notes${buildListSearch(params || undefined)}`,
      transformResponse: (res: Envelope<AdminLeadRow[]>) => res.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((row) => ({ type: 'adminLeads' as const, id: `note-${row.id}` })),
              { type: 'adminLeads', id: 'NOTES' },
            ]
          : [{ type: 'adminLeads', id: 'NOTES' }],
    }),
    patchAdminLeadSave: builder.mutation<AdminLeadRow, { id: string; body: PatchAdminLeadBody }>({
      query: ({ id, body }) => ({
        url: `/admin/leads/saves/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<AdminLeadRow>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'adminLeads', id: 'SAVES' },
        { type: 'adminLeads', id: 'NOTES' },
        { type: 'adminLeads', id: 'STATS' },
        { type: 'adminLeads', id: `save-${arg.id}` },
      ],
    }),
    deleteAdminLeadSave: builder.mutation<{ id: string; deleted: boolean }, string>({
      query: (id) => ({
        url: `/admin/leads/saves/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<{ id: string; deleted: boolean }>) => res.data,
      invalidatesTags: [
        { type: 'adminLeads', id: 'SAVES' },
        { type: 'adminLeads', id: 'NOTES' },
        { type: 'adminLeads', id: 'STATS' },
      ],
    }),
    patchAdminLeadNote: builder.mutation<AdminLeadRow, { id: string; body: PatchAdminLeadBody }>({
      query: ({ id, body }) => ({
        url: `/admin/leads/notes/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<AdminLeadRow>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'adminLeads', id: 'NOTES' },
        { type: 'adminLeads', id: 'SAVES' },
        { type: 'adminLeads', id: 'STATS' },
        { type: 'adminLeads', id: `note-${arg.id}` },
      ],
    }),
    deleteAdminLeadNote: builder.mutation<{ id: string; deleted: boolean }, string>({
      query: (id) => ({
        url: `/admin/leads/notes/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<{ id: string; deleted: boolean }>) => res.data,
      invalidatesTags: [
        { type: 'adminLeads', id: 'NOTES' },
        { type: 'adminLeads', id: 'SAVES' },
        { type: 'adminLeads', id: 'STATS' },
      ],
    }),
  }),
})

export const {
  useGetAdminLeadsStatsQuery,
  useGetAdminLeadsSavesQuery,
  useGetAdminLeadsNotesQuery,
  usePatchAdminLeadSaveMutation,
  useDeleteAdminLeadSaveMutation,
  usePatchAdminLeadNoteMutation,
  useDeleteAdminLeadNoteMutation,
} = adminLeadsApi

export default adminLeadsApi
