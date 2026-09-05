import type { ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import type { CreateCrmEventPayload, CrmEventAttachment } from '@/types/crmEvent'
import type { MeetingScope } from '@/types/meeting'

export type CreateCrmEventSubmitPayload = {
  scope: MeetingScope
  owner: ProfileOwnerSelection | null
  groupProfileIds?: string[]
  companyUserId?: string | null
  type: string
  date: string
  time: string
  attachments: CrmEventAttachment[]
  globalHost?: string
}

export function buildCreateCrmEventPayload(payload: CreateCrmEventSubmitPayload): CreateCrmEventPayload {
  const host =
    payload.scope === 'global'
      ? payload.globalHost?.trim() || 'vBiz Team'
      : payload.owner?.hostName?.trim() || 'vCard Owner'

  const recipientEmail = payload.owner?.ownerEmails?.[0]?.trim().toLowerCase() || null
  const recipientName = payload.owner?.hostName?.trim() || host

  const base: CreateCrmEventPayload = {
    host,
    type: payload.type,
    date: payload.date,
    time: payload.time,
    status: 'Scheduled',
    scope: payload.scope,
    attachments: payload.attachments,
    recipientEmail,
    recipientName,
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
