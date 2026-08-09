import { api } from '@/redux/api/api'
import type {
  CreateMeetingPayload,
  Meeting,
  MeetingListPage,
  MeetingListQuery,
  UpdateMeetingPayload,
} from '@/types/meeting'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

const meetingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMeetings: builder.query<MeetingListPage, MeetingListQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        const skip = params?.skip ?? 0
        const limit = params?.limit ?? 50
        search.set('skip', String(skip))
        search.set('limit', String(limit))
        if (params?.status) search.set('status', params.status)
        if (params?.type) search.set('type', params.type)
        if (params?.from) search.set('from', params.from)
        if (params?.to) search.set('to', params.to)
        if (params?.profileId) search.set('profileId', params.profileId)
        return `/meetings?${search.toString()}`
      },
      transformResponse: (res: Envelope<MeetingListPage>) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((m) => ({ type: 'meetings' as const, id: m.id })),
              { type: 'meetings' as const, id: 'LIST' },
            ]
          : [{ type: 'meetings', id: 'LIST' }],
    }),
    getMeeting: builder.query<Meeting, string>({
      query: (id) => `/meetings/${id}`,
      transformResponse: (res: Envelope<Meeting>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'meetings', id }],
    }),
    createMeeting: builder.mutation<Meeting, CreateMeetingPayload>({
      query: (body) => ({ url: '/meetings', method: 'POST', body }),
      transformResponse: (res: Envelope<Meeting>) => res.data,
      invalidatesTags: [
        { type: 'meetings', id: 'LIST' },
        { type: 'activity', id: 'FEED' },
        { type: 'activity', id: 'AUDIT' },
      ],
    }),
    updateMeeting: builder.mutation<Meeting, { id: string; body: UpdateMeetingPayload }>({
      query: ({ id, body }) => ({ url: `/meetings/${id}`, method: 'PATCH', body }),
      transformResponse: (res: Envelope<Meeting>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'meetings', id: arg.id },
        { type: 'meetings', id: 'LIST' },
        { type: 'activity', id: 'FEED' },
        { type: 'activity', id: 'AUDIT' },
      ],
    }),
    deleteMeeting: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/meetings/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: [
        { type: 'meetings', id: 'LIST' },
        { type: 'activity', id: 'FEED' },
        { type: 'activity', id: 'AUDIT' },
      ],
    }),
  }),
})

export const {
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
} = meetingsApi

export default meetingsApi
