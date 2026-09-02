import type { ScheduleMeetingSubmitPayload } from '@/components/admin/ScheduleMeetingModal'
import type { CreateMeetingPayload } from '@/types/meeting'

export function buildCreateMeetingPayload(payload: ScheduleMeetingSubmitPayload): CreateMeetingPayload {
  const host =
    payload.scope === 'global'
      ? payload.globalHost?.trim() || 'vBiz Team'
      : payload.owner?.hostName?.trim() || 'vCard Owner'

  const base: CreateMeetingPayload = {
    host,
    type: payload.type,
    date: payload.date,
    time: payload.time,
    notes: payload.notes,
    status: 'Scheduled',
    scope: payload.scope,
  }

  if (payload.scope === 'global') {
    return { ...base, profileId: null }
  }

  if (payload.scope === 'group') {
    return {
      ...base,
      profileId: payload.owner?.profileId ?? payload.groupProfileIds?.[0] ?? null,
      ...(payload.groupProfileIds?.length ? { groupProfileIds: payload.groupProfileIds } : {}),
      companyUserId: payload.companyUserId ?? null,
    }
  }

  return {
    ...base,
    profileId: payload.owner?.profileId ?? null,
  }
}
