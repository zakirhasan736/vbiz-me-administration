import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type OneOnOneRequest = {
  id: string
  profileId: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  message: string | null
  status: string
  cardOwnerUserId: string | null
  corporateId: string | null
  createdAt: string
  updatedAt: string
  meeting: {
    id: string
    title: string
    description: string | null
    startAt: string
    endAt: string
    timezone: string
    status: string
    zohoCalendarEventId: string | null
    zohoMeetingId: string | null
    zohoMeetingUrl: string | null
  } | null
}

export type OneOnOneMeeting = OneOnOneRequest['meeting']

export type Schedule1On1Payload = {
  requestId: string
  title?: string
  date: string
  startTime: string
  durationMinutes?: number
  timezone: string
  description?: string | null
}

export type OneOnOneScheduleResult = {
  request: OneOnOneRequest
  meeting: {
    id: string
    requestId: string
    cardId: string
    title: string
    description: string | null
    startAt: string
    endAt: string
    timezone: string
    status: string
    zohoMeetingUrl: string | null
  }
}

export type OpenRequestsPage = {
  items: OneOnOneRequest[]
  total: number
  skip: number
  limit: number
}

export type GuestMeetingView = {
  title: string
  guestName: string
  date: string
  startTime: string
  endTime: string
  timezone: string
  description: string | null
  joinUrl: string | null
  status: string
}

const oneOnOneApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listOpenOneOnOneRequests: builder.query<OpenRequestsPage, void>({
      query: () => '/one-on-one/open',
      transformResponse: (res: Envelope<OpenRequestsPage>) => res.data,
      providesTags: [{ type: 'meetings', id: 'ONE_ON_ONE_LIST' }],
    }),
    scheduleOneOnOneMeeting: builder.mutation<OneOnOneScheduleResult, Schedule1On1Payload>({
      query: (body) => ({
        url: '/one-on-one/schedule',
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<OneOnOneScheduleResult>) => res.data,
      invalidatesTags: [{ type: 'meetings', id: 'ONE_ON_ONE_LIST' }],
    }),
    rescheduleOneOnOneMeeting: builder.mutation<OneOnOneScheduleResult, Schedule1On1Payload>({
      query: (body) => ({
        url: '/one-on-one/reschedule',
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<OneOnOneScheduleResult>) => res.data,
      invalidatesTags: [{ type: 'meetings', id: 'ONE_ON_ONE_LIST' }],
    }),
    cancelOneOnOneMeeting: builder.mutation<{ id: string; status: string }, { requestId: string }>({
      query: ({ requestId }) => ({
        url: '/one-on-one/cancel',
        method: 'POST',
        body: { requestId },
      }),
      transformResponse: (res: Envelope<{ id: string; status: string }>) => res.data,
      invalidatesTags: [{ type: 'meetings', id: 'ONE_ON_ONE_LIST' }],
    }),
    completeOneOnOneMeeting: builder.mutation<{ id: string; status: string }, { requestId: string }>({
      query: ({ requestId }) => ({
        url: '/one-on-one/complete',
        method: 'POST',
        body: { requestId },
      }),
      transformResponse: (res: Envelope<{ id: string; status: string }>) => res.data,
      invalidatesTags: [{ type: 'meetings', id: 'ONE_ON_ONE_LIST' }],
    }),
    createPublicOneOnOneRequest: builder.mutation<
      OneOnOneRequest,
      {
        profileId: string
        guestName: string
        guestEmail: string
        guestPhone?: string | null
        message?: string | null
      }
    >({
      query: (body) => ({
        url: '/one-on-one/requests',
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<OneOnOneRequest>) => res.data,
    }),
    getGuestOneOnOneMeeting: builder.query<GuestMeetingView, string>({
      query: (requestId) => `/one-on-one/guest/${requestId}`,
      transformResponse: (res: Envelope<GuestMeetingView>) => res.data,
    }),
  }),
})

export const {
  useListOpenOneOnOneRequestsQuery,
  useScheduleOneOnOneMeetingMutation,
  useRescheduleOneOnOneMeetingMutation,
  useCancelOneOnOneMeetingMutation,
  useCompleteOneOnOneMeetingMutation,
  useCreatePublicOneOnOneRequestMutation,
  useGetGuestOneOnOneMeetingQuery,
} = oneOnOneApi

export default oneOnOneApi
