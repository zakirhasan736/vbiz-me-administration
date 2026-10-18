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
  description: string
  attachments: CrmEventAttachment[]
  globalHost?: string
  /** Optional CRM lead this event was created from. */
  guestUserDataId?: string | null
  /** Selected CRM lead ids for single / grouped / (optional) global snapshot. */
  recipientLeadIds?: string[]
  /** IANA USA timezone for scheduled send (default America/New_York). */
  timezone?: string
}

export function buildCreateCrmEventPayload(payload: CreateCrmEventSubmitPayload): CreateCrmEventPayload {
  const host =
    payload.scope === 'global'
      ? payload.globalHost?.trim() || 'vBiz Team'
      : payload.owner?.hostName?.trim() || 'vCard Owner'

  const leadIds = [
    ...new Set(
      [...(payload.recipientLeadIds || []), payload.guestUserDataId || payload.owner?.guestUserDataId || '']
        .map((id) => (id || '').trim())
        .filter(Boolean)
    ),
  ]

  const recipientEmail = payload.owner?.ownerEmails?.[0]?.trim().toLowerCase() || null
  const recipientName = payload.owner?.hostName?.trim() || host
  const description = payload.description.trim()
  const timezone = payload.timezone?.trim() || 'America/New_York'

  const base: CreateCrmEventPayload = {
    host,
    type: payload.type,
    date: payload.date,
    time: payload.time,
    description,
    status: 'Scheduled',
    scope: payload.scope,
    attachments: payload.attachments,
    recipientEmail,
    recipientName,
    timezone,
    ...(leadIds[0] ? { guestUserDataId: leadIds[0] } : {}),
    ...(leadIds.length ? { recipientLeadIds: leadIds } : {}),
  }

  if (payload.scope === 'global') {
    return {
      ...base,
      profileId: payload.owner?.profileId ?? null,
    }
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
