export const MEETING_TYPES = [
  'Growth Meeting',
  'Onboarding Call',
  'Onboarding Session',
  'Phone Consultation',
  'Billing Consultation',
  'Technical Support',
] as const

export type MeetingType = (typeof MEETING_TYPES)[number]

export const MEETING_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const

export type MeetingStatus = (typeof MEETING_STATUSES)[number]

export const MEETING_SCOPES = ['global', 'group', 'one_to_one'] as const

export type MeetingScope = (typeof MEETING_SCOPES)[number]

export type Meeting = {
  id: string
  host: string
  type: MeetingType | string
  date: string
  time: string
  startsAt: string
  location: string | null
  notes: string | null
  status: MeetingStatus
  scope: MeetingScope
  profileId: string | null
  groupProfileIds?: string[]
  googleEventId?: string | null
  meetLink?: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export type CreateMeetingPayload = {
  host: string
  type: string
  date: string
  time: string
  location?: string | null
  notes?: string | null
  status?: MeetingStatus
  scope?: MeetingScope
  profileId?: string | null
  groupProfileIds?: string[]
  companyUserId?: string | null
  /** Owner backoffice + in-app only — skip public-card / saver push. */
  onlyBackoffice?: boolean
}

export type UpdateMeetingPayload = Partial<CreateMeetingPayload>

export type MeetingListQuery = {
  status?: MeetingStatus
  type?: string
  from?: string
  to?: string
  profileId?: string
  scope?: MeetingScope
  skip?: number
  limit?: number
}

export type MeetingListPage = {
  items: Meeting[]
  total: number
  skip: number
  limit: number
}

export type OwnerMeetingListQuery = {
  status?: MeetingStatus
  from?: string
  to?: string
  profileId?: string
  upcomingOnly?: boolean
  skip?: number
  limit?: number
}
