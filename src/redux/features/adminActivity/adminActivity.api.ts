import { api } from '@/redux/api/api'
import type {
  ActivityFeedPage,
  ActivityFeedQuery,
  AuditLogEntry,
  AuditLogListPage,
  AuditLogListQuery,
  CreateAuditLogPayload,
} from '@/types/activity'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

const adminActivityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getActivityFeed: builder.query<ActivityFeedPage, ActivityFeedQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('category', params?.category ?? 'all')
        search.set('skip', String(params?.skip ?? 0))
        search.set('limit', String(params?.limit ?? 50))
        return `/admin/activity-feed?${search.toString()}`
      },
      transformResponse: (res: Envelope<ActivityFeedPage>) => res.data,
      providesTags: [{ type: 'activity', id: 'FEED' }],
    }),
    getAuditLogs: builder.query<AuditLogListPage, AuditLogListQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('skip', String(params?.skip ?? 0))
        search.set('limit', String(params?.limit ?? 50))
        if (params?.type) search.set('type', params.type)
        return `/admin/audit-logs?${search.toString()}`
      },
      transformResponse: (res: Envelope<AuditLogListPage>) => res.data,
      providesTags: [{ type: 'activity', id: 'AUDIT' }],
    }),
    createAuditLog: builder.mutation<AuditLogEntry, CreateAuditLogPayload>({
      query: (body) => ({ url: '/admin/audit-logs', method: 'POST', body }),
      transformResponse: (res: Envelope<AuditLogEntry>) => res.data,
      invalidatesTags: [
        { type: 'activity', id: 'FEED' },
        { type: 'activity', id: 'AUDIT' },
      ],
    }),
    clearAuditLogs: builder.mutation<{ deleted: number }, void>({
      query: () => ({ url: '/admin/audit-logs', method: 'DELETE' }),
      transformResponse: (res: Envelope<{ deleted: number }>) => res.data,
      invalidatesTags: [
        { type: 'activity', id: 'FEED' },
        { type: 'activity', id: 'AUDIT' },
      ],
    }),
  }),
})

export const { useGetActivityFeedQuery, useGetAuditLogsQuery, useCreateAuditLogMutation, useClearAuditLogsMutation } =
  adminActivityApi

export default adminActivityApi
