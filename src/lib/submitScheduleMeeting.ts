import type { ScheduleMeetingSubmitPayload } from '@/components/admin/ScheduleMeetingModal'
import { buildCreateMeetingPayload } from '@/lib/buildCreateMeetingPayload'
import { notifyScheduleCreated } from '@/lib/scheduleMeetingNotifications'
import type { Meeting } from '@/types/meeting'

type CreateMeetingFn = (payload: ReturnType<typeof buildCreateMeetingPayload>) => {
  unwrap: () => Promise<Meeting>
}

type NotifyExtras = {
  ownerAudience?: 'single' | 'corporate'
  ownerRole?: string | null
  companyUserRole?: string | null
}

export async function submitScheduleMeeting(
  createMeeting: CreateMeetingFn,
  payload: ScheduleMeetingSubmitPayload,
  notifyExtras: NotifyExtras = {}
): Promise<Meeting> {
  const body = buildCreateMeetingPayload(payload)
  const created = await createMeeting(body).unwrap()

  notifyScheduleCreated({
    meeting: created,
    hostName: body.host,
    meetType: payload.type,
    meetDate: payload.date,
    meetTime: payload.time,
    scope: payload.scope,
    profileId: body.profileId,
    groupProfileIds: body.groupProfileIds,
    ...notifyExtras,
  })

  return created
}
