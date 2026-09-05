import type { MeetingScope } from '@/types/meeting'

export const CRM_EVENT_TYPES = [
  'Birthday Wish',
  'Anniversary',
  'Congratulations',
  'Thank You',
  'Follow-up Message',
  'Custom Wish',
] as const

export type CrmEventType = (typeof CRM_EVENT_TYPES)[number]

export const CRM_EVENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const

export type CrmEventStatus = (typeof CRM_EVENT_STATUSES)[number]

export type CrmEventAttachment = {
  url: string
  fileName: string
  mimeType?: string | null
  publicId?: string | null
  resourceType?: 'image' | 'video' | 'audio' | null
}

export type CrmEvent = {
  id: string
  host: string
  type: CrmEventType | string
  date: string
  time: string
  startsAt: string
  status: CrmEventStatus
  scope: MeetingScope
  profileId: string | null
  groupProfileIds?: string[]
  attachments: CrmEventAttachment[]
  recipientEmail?: string | null
  recipientName?: string | null
  googleEventId?: string | null
  meetLink?: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCrmEventPayload = {
  host: string
  type: string
  date: string
  time: string
  status?: CrmEventStatus
  scope?: MeetingScope
  profileId?: string | null
  groupProfileIds?: string[]
  companyUserId?: string | null
  attachments?: CrmEventAttachment[]
  recipientEmail?: string | null
  recipientName?: string | null
}

export type UpdateCrmEventPayload = Partial<CreateCrmEventPayload>

export type CrmEventListQuery = {
  status?: CrmEventStatus
  type?: string
  from?: string
  to?: string
  profileId?: string
  scope?: MeetingScope
  skip?: number
  limit?: number
}

export type CrmEventListPage = {
  items: CrmEvent[]
  total: number
  skip: number
  limit: number
  hasMore: boolean
}
