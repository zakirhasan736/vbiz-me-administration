import { api } from '@/redux/api/api'
import type {
  CreateSupportTicketPayload,
  SupportTicket,
  SupportTicketListPage,
  SupportTicketListQuery,
  UpdateSupportTicketPayload,
} from '@/types/support'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

const adminSupportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSupportTickets: builder.query<SupportTicketListPage, SupportTicketListQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('skip', String(params?.skip ?? 0))
        search.set('limit', String(params?.limit ?? 50))
        if (params?.status) search.set('status', params.status)
        if (params?.channel) search.set('channel', params.channel)
        return `/admin/support-tickets?${search.toString()}`
      },
      transformResponse: (res: Envelope<SupportTicketListPage>) => res.data,
      providesTags: (result) =>
        result
          ? [
              { type: 'adminSupport' as const, id: 'LIST' },
              ...result.items.map((t) => ({ type: 'adminSupport' as const, id: t.id })),
            ]
          : [{ type: 'adminSupport' as const, id: 'LIST' }],
    }),
    getSupportTicket: builder.query<SupportTicket, string>({
      query: (id) => `/admin/support-tickets/${id}`,
      transformResponse: (res: Envelope<SupportTicket>) => res.data,
      providesTags: (_result, _error, id) => [{ type: 'adminSupport', id }],
    }),
    createSupportTicket: builder.mutation<SupportTicket, CreateSupportTicketPayload>({
      query: (body) => ({ url: '/admin/support-tickets', method: 'POST', body }),
      transformResponse: (res: Envelope<SupportTicket>) => res.data,
      invalidatesTags: [{ type: 'adminSupport', id: 'LIST' }],
    }),
    updateSupportTicket: builder.mutation<SupportTicket, { id: string; body: UpdateSupportTicketPayload }>({
      query: ({ id, body }) => ({
        url: `/admin/support-tickets/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<SupportTicket>) => res.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'adminSupport', id: 'LIST' },
        { type: 'adminSupport', id },
      ],
    }),
  }),
})

export const {
  useGetSupportTicketsQuery,
  useGetSupportTicketQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation,
} = adminSupportApi

export default adminSupportApi
