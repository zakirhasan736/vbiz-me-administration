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

export type CrmDashboardScope = 'admin' | 'corporate' | 'single'

export type CrmLeadOrigin = 'guest' | 'crm_external'

export type CrmDashboard = {
  scope: CrmDashboardScope
  metrics: {
    newLeads: number
    openLeads: number
    externalLeads: number
  }
}

export type CrmLeadMetadata = {
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

export type CrmLeadRow = {
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
  origin: CrmLeadOrigin
  metadata: CrmLeadMetadata
}

export type CrmLeadsListQuery = {
  q?: string
  profileId?: string
  origin?: CrmLeadOrigin
  skip?: number
  limit?: number
}

export type CrmLeadsPage = {
  items: CrmLeadRow[]
  total: number
  skip: number
  limit: number
  hasMore: boolean
}

export type CreateCrmLeadBody = {
  fullName: string
  email?: string
  phone?: string
  notes?: string
  profileId: string
}

export type PatchCrmLeadBody = {
  privateNotes?: string
  lastReply?: string
}

function buildListSearch(params?: CrmLeadsListQuery) {
  const search = new URLSearchParams()
  if (params?.q?.trim()) search.set('q', params.q.trim())
  if (params?.profileId?.trim()) search.set('profileId', params.profileId.trim())
  if (params?.origin) search.set('origin', params.origin)
  if (params?.skip != null) search.set('skip', String(params.skip))
  if (params?.limit != null) search.set('limit', String(params.limit))
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

function toPage(res: Envelope<CrmLeadRow[]>, fallbackSkip = 0, fallbackLimit = 50): CrmLeadsPage {
  const items = res.data ?? []
  const total = res.meta?.total ?? res.totalDoc ?? items.length
  const skip = res.meta?.skip ?? fallbackSkip
  const limit = res.meta?.limit ?? fallbackLimit
  const hasMore = res.meta?.hasMore ?? skip + items.length < total
  return { items, total, skip, limit, hasMore }
}

const crmApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCrmDashboard: builder.query<CrmDashboard, void>({
      query: () => '/crm/dashboard',
      transformResponse: (res: Envelope<CrmDashboard>) => res.data,
      providesTags: [{ type: 'crm', id: 'DASHBOARD' }],
    }),
    getCrmLeads: builder.query<CrmLeadsPage, CrmLeadsListQuery | void>({
      query: (params) => `/crm/leads${buildListSearch(params || undefined)}`,
      transformResponse: (res: Envelope<CrmLeadRow[]>, _meta, arg) => toPage(res, arg?.skip ?? 0, arg?.limit ?? 50),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((row) => ({ type: 'crm' as const, id: `lead-${row.id}` })),
              { type: 'crm', id: 'LEADS' },
            ]
          : [{ type: 'crm', id: 'LEADS' }],
    }),
    createCrmLead: builder.mutation<CrmLeadRow, CreateCrmLeadBody>({
      query: (body) => ({ url: '/crm/leads', method: 'POST', body }),
      transformResponse: (res: Envelope<CrmLeadRow>) => res.data,
      invalidatesTags: [
        { type: 'crm', id: 'LEADS' },
        { type: 'crm', id: 'DASHBOARD' },
      ],
    }),
    patchCrmLead: builder.mutation<CrmLeadRow, { id: string; body: PatchCrmLeadBody }>({
      query: ({ id, body }) => ({
        url: `/crm/leads/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<CrmLeadRow>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'crm', id: 'LEADS' },
        { type: 'crm', id: `lead-${arg.id}` },
      ],
    }),
    deleteCrmLead: builder.mutation<{ id: string; deleted: boolean }, string>({
      query: (id) => ({
        url: `/crm/leads/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<{ id: string; deleted: boolean }>) => res.data,
      invalidatesTags: [
        { type: 'crm', id: 'LEADS' },
        { type: 'crm', id: 'DASHBOARD' },
      ],
    }),
  }),
})

export const {
  useGetCrmDashboardQuery,
  useGetCrmLeadsQuery,
  useCreateCrmLeadMutation,
  usePatchCrmLeadMutation,
  useDeleteCrmLeadMutation,
} = crmApi

export default crmApi
