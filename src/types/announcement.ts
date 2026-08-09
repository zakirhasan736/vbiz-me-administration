export type AnnouncementKind = 'announcement' | 'warning'
export type AnnouncementType = 'info' | 'warning' | 'success'
export type AnnouncementStatus = 'active' | 'archived'
export type AnnouncementTargetType = 'all' | 'specific'

export type Announcement = {
  id: string
  kind: AnnouncementKind
  type: AnnouncementType
  title: string
  body: string
  status: AnnouncementStatus
  targetType: AnnouncementTargetType
  targetEmails: string[]
  startsAt: string | null
  endsAt: string | null
  meta?: Record<string, string>
  createdById?: string
  createdAt: string
  updatedAt: string
}

export type AnnouncementListPage = {
  items: Announcement[]
  total: number
  skip: number
  limit: number
  activeCount: number
}

export type AnnouncementListQuery = {
  status?: AnnouncementStatus
  kind?: AnnouncementKind
  skip?: number
  limit?: number
}

export type CreateAnnouncementPayload = {
  kind?: AnnouncementKind
  type: AnnouncementType
  title?: string
  body: string
  status?: AnnouncementStatus
  targetType?: AnnouncementTargetType
  targetEmails?: string[]
  startsAt?: string | null
  endsAt?: string | null
  meta?: Record<string, string> | null
}

export type UpdateAnnouncementPayload = {
  kind?: AnnouncementKind
  type?: AnnouncementType
  title?: string
  body?: string
  status?: AnnouncementStatus
  targetType?: AnnouncementTargetType
  targetEmails?: string[]
  startsAt?: string | null
  endsAt?: string | null
  meta?: Record<string, string> | null
}

export type ClearLiveAnnouncementResult = {
  clearedCount: number
}
