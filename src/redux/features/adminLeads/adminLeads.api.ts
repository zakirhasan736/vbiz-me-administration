import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
  totalDoc?: number
  meta?: {
    skip: number
    limit: number
    page: number
    total: number
    hasMore: boolean
  }
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
  vCardDesignation?: string
  vCardProfession?: string
  vCardCompany?: string
  kind: 'guest_save' | 'guest_message'
  consent: boolean
  origin?: 'guest' | 'crm_external'
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
  skip?: number
  limit?: number
}

export type AdminLeadsPage = {
  items: AdminLeadRow[]
  total: number
  skip: number
  limit: number
  hasMore: boolean
}

export type PatchAdminLeadBody = {
  privateNotes?: string
  lastReply?: string
}

function buildListSearch(params?: AdminLeadsListQuery) {
  const search = new URLSearchParams()
  if (params?.q?.trim()) search.set('q', params.q.trim())
  if (params?.profileId?.trim()) search.set('profileId', params.profileId.trim())
  if (params?.skip != null) search.set('skip', String(params.skip))
  if (params?.limit != null) search.set('limit', String(params.limit))
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

function toPage(res: Envelope<AdminLeadRow[]>, fallbackSkip = 0, fallbackLimit = 50): AdminLeadsPage {
  const items = res.data ?? []
  const total = res.meta?.total ?? res.totalDoc ?? items.length
  const skip = res.meta?.skip ?? fallbackSkip
  const limit = res.meta?.limit ?? fallbackLimit
  const hasMore = res.meta?.hasMore ?? skip + items.length < total
  return { items, total, skip, limit, hasMore }
}

const adminLeadsApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminLeadsStats: builder.query<AdminLeadsStats, void>({
      query: () => '/admin/leads/stats',
      transformResponse: (res: Envelope<AdminLeadsStats>) => res.data,
      providesTags: [{ type: 'adminLeads', id: 'STATS' }],
    }),
    getAdminLeadsSaves: builder.query<AdminLeadsPage, AdminLeadsListQuery | void>({
      query: (params) => `/admin/leads/saves${buildListSearch(params || undefined)}`,
      transformResponse: (res: Envelope<AdminLeadRow[]>, _meta, arg) => toPage(res, arg?.skip ?? 0, arg?.limit ?? 50),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((row) => ({ type: 'adminLeads' as const, id: `save-${row.id}` })),
              { type: 'adminLeads', id: 'SAVES' },
            ]
          : [{ type: 'adminLeads', id: 'SAVES' }],
    }),
    getAdminLeadsNotes: builder.query<AdminLeadsPage, AdminLeadsListQuery | void>({
      query: (params) => `/admin/leads/notes${buildListSearch(params || undefined)}`,
      transformResponse: (res: Envelope<AdminLeadRow[]>, _meta, arg) => toPage(res, arg?.skip ?? 0, arg?.limit ?? 50),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((row) => ({ type: 'adminLeads' as const, id: `note-${row.id}` })),
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
        'dashboard',
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
        'dashboard',
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
        'dashboard',
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
        'dashboard',
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
