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

export type WorkNoteStatus = 'not_started' | 'in_progress' | 'in_review' | 'complete'

export type WorkNoteRow = {
  id: string
  title: string
  description: string | null
  status: WorkNoteStatus
  assigneeUserId: string | null
  assigneeName: string | null
  createdById: string
  createdByName: string | null
  profileId: string | null
  profileName: string | null
  leadRef: string | null
  startsAt: string | null
  dueAt: string | null
  remindAt: string | null
  ownerUserId: string | null
  companyUserId: string | null
  sortOrder?: number
  createdAt: string
  updatedAt: string
  isOverdue: boolean
}

export type CrmDashboard = {
  scope: CrmDashboardScope
  metrics: {
    newLeads: number
    openLeads: number
    externalLeads: number
    workNotesTotal?: number
    workNotesOpen?: number
    workNotesOverdue?: number
    upcomingMeetings?: number
  }
  upcomingWorkNotes?: WorkNoteRow[]
  overdueWorkNotes?: WorkNoteRow[]
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

export type SchedulePerson = {
  id: string
  kind: 'card' | 'guest'
  name: string
  email: string
  phone: string
  profileId: string | null
  subtitle: string
}

export type WorkNotesListQuery = {
  q?: string
  status?: WorkNoteStatus
  skip?: number
  limit?: number
}

export type WorkNotesPage = {
  items: WorkNoteRow[]
  total: number
  skip: number
  limit: number
  hasMore: boolean
}

export type CreateWorkNoteBody = {
  title: string
  description?: string
  status?: WorkNoteStatus
  assigneeUserId?: string
  profileId?: string
  leadRef?: string
  startsAt?: string
  dueAt?: string
  remindAt?: string
}

export type UpdateWorkNoteBody = Partial<{
  title: string
  description: string | null
  status: WorkNoteStatus
  sortOrder: number
  assigneeUserId: string | null
  profileId: string | null
  leadRef: string | null
  startsAt: string | null
  dueAt: string | null
  remindAt: string | null
}>

export type ReorderWorkNotesBody = {
  items: { id: string; status: WorkNoteStatus; sortOrder: number }[]
}

export type CrmScheduleCalendarItem = {
  kind: 'meeting' | 'work_note'
  id: string
  zohoEventId?: string | null
  title: string
  host: string
  type: string
  date: string
  time: string
  startsAt: string
  status: string
  meetLink?: string | null
  notes?: string | null
  scope?: string
  profileId?: string | null
  canManageMeeting: boolean
}

export type CrmScheduleCalendarPage = {
  items: CrmScheduleCalendarItem[]
  zohoError: string | null
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

function buildWorkNotesSearch(params?: WorkNotesListQuery) {
  const search = new URLSearchParams()
  if (params?.q?.trim()) search.set('q', params.q.trim())
  if (params?.status) search.set('status', params.status)
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

function toWorkNotesPage(res: Envelope<WorkNoteRow[]>, fallbackSkip = 0, fallbackLimit = 100): WorkNotesPage {
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
        { type: 'crm', id: 'SCHEDULE_PEOPLE' },
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
    searchCrmSchedulePeople: builder.query<SchedulePerson[], { q?: string; limit?: number } | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.q?.trim()) search.set('q', params.q.trim())
        if (params?.limit != null) search.set('limit', String(params.limit))
        const qs = search.toString()
        return `/crm/schedule-people${qs ? `?${qs}` : ''}`
      },
      transformResponse: (res: Envelope<SchedulePerson[]>) => res.data ?? [],
      providesTags: [{ type: 'crm', id: 'SCHEDULE_PEOPLE' }],
    }),
    getCrmScheduleCalendar: builder.query<CrmScheduleCalendarPage, { from: string; to: string }>({
      query: ({ from, to }) => {
        const search = new URLSearchParams({ from, to })
        return `/crm/schedule-calendar?${search.toString()}`
      },
      transformResponse: (res: Envelope<CrmScheduleCalendarPage>) => res.data,
      providesTags: [{ type: 'crm', id: 'SCHEDULE_CALENDAR' }],
    }),
    getCrmWorkNotes: builder.query<WorkNotesPage, WorkNotesListQuery | void>({
      query: (params) => `/crm/work-notes${buildWorkNotesSearch(params || undefined)}`,
      transformResponse: (res: Envelope<WorkNoteRow[]>, _meta, arg) =>
        toWorkNotesPage(res, arg?.skip ?? 0, arg?.limit ?? 100),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((row) => ({ type: 'crm' as const, id: `work-${row.id}` })),
              { type: 'crm', id: 'WORK_NOTES' },
            ]
          : [{ type: 'crm', id: 'WORK_NOTES' }],
    }),
    getCrmWorkNote: builder.query<WorkNoteRow, string>({
      query: (id) => `/crm/work-notes/${encodeURIComponent(id)}`,
      transformResponse: (res: Envelope<WorkNoteRow>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'crm', id: `work-${id}` }],
    }),
    createCrmWorkNote: builder.mutation<WorkNoteRow, CreateWorkNoteBody>({
      query: (body) => ({ url: '/crm/work-notes', method: 'POST', body }),
      transformResponse: (res: Envelope<WorkNoteRow>) => res.data,
      invalidatesTags: [
        { type: 'crm', id: 'WORK_NOTES' },
        { type: 'crm', id: 'DASHBOARD' },
        { type: 'crm', id: 'SCHEDULE_CALENDAR' },
      ],
    }),
    updateCrmWorkNote: builder.mutation<WorkNoteRow, { id: string; body: UpdateWorkNoteBody }>({
      query: ({ id, body }) => ({
        url: `/crm/work-notes/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<WorkNoteRow>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'crm', id: 'WORK_NOTES' },
        { type: 'crm', id: `work-${arg.id}` },
        { type: 'crm', id: 'DASHBOARD' },
        { type: 'crm', id: 'SCHEDULE_CALENDAR' },
      ],
    }),
    reorderCrmWorkNotes: builder.mutation<{ updated: number }, ReorderWorkNotesBody>({
      query: (body) => ({
        url: '/crm/work-notes/reorder',
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<{ updated: number }>) => res.data,
      invalidatesTags: [
        { type: 'crm', id: 'WORK_NOTES' },
        { type: 'crm', id: 'DASHBOARD' },
      ],
    }),
    deleteCrmWorkNote: builder.mutation<{ id: string; deleted: boolean }, string>({
      query: (id) => ({
        url: `/crm/work-notes/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<{ id: string; deleted: boolean }>) => res.data,
      invalidatesTags: [
        { type: 'crm', id: 'WORK_NOTES' },
        { type: 'crm', id: 'DASHBOARD' },
        { type: 'crm', id: 'SCHEDULE_CALENDAR' },
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
  useSearchCrmSchedulePeopleQuery,
  useLazySearchCrmSchedulePeopleQuery,
  useGetCrmScheduleCalendarQuery,
  useGetCrmWorkNotesQuery,
  useGetCrmWorkNoteQuery,
  useCreateCrmWorkNoteMutation,
  useUpdateCrmWorkNoteMutation,
  useReorderCrmWorkNotesMutation,
  useDeleteCrmWorkNoteMutation,
} = crmApi

export default crmApi
