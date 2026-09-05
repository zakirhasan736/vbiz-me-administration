import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type OneOnOneSlot = {
  id: string
  date: string
  startTime: string
  durationMinutes: number
  timezone: string
  status: string
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
  proposedTitle?: string | null
  proposedDescription?: string | null
  proposedTimezone?: string | null
  proposedDurationMinutes?: number | null
  createdAt: string
  updatedAt: string
  slots?: OneOnOneSlot[]
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

export type Propose1On1SlotsPayload = {
  requestId: string
  title?: string
  description?: string | null
  timezone: string
  durationMinutes?: number
  slots: Array<{ date: string; startTime: string }>
}

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
  } | null
  guestPickUrl?: string
}

export type OpenRequestsPage = {
  items: OneOnOneRequest[]
  total: number
  skip: number
  limit: number
}

export type GuestMeetingView = {
  mode: 'pick_slot' | 'confirmed'
  title: string
  guestName: string
  date: string
  startTime: string
  endTime: string
  timezone: string
  description: string | null
  joinUrl: string | null
  status: string
  slots: OneOnOneSlot[]
}

const oneOnOneApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listOpenOneOnOneRequests: builder.query<OpenRequestsPage, void>({
      query: () => '/one-on-one/open',
      transformResponse: (res: Envelope<OpenRequestsPage>) => res.data,
      providesTags: [{ type: 'meetings', id: 'ONE_ON_ONE_LIST' }],
    }),
    scheduleOneOnOneMeeting: builder.mutation<OneOnOneScheduleResult, Propose1On1SlotsPayload>({
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
    confirmGuestOneOnOneSlot: builder.mutation<OneOnOneScheduleResult, { requestId: string; slotId: string }>({
      query: ({ requestId, slotId }) => ({
        url: `/one-on-one/guest/${requestId}/confirm-slot`,
        method: 'POST',
        body: { slotId },
      }),
      transformResponse: (res: Envelope<OneOnOneScheduleResult>) => res.data,
      invalidatesTags: [{ type: 'meetings', id: 'ONE_ON_ONE_LIST' }],
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
  useConfirmGuestOneOnOneSlotMutation,
} = oneOnOneApi

export default oneOnOneApi
