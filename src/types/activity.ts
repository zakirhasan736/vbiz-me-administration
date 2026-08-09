export const ACTIVITY_CATEGORIES = ['all', 'engagement', 'creations', 'updates', 'deletions'] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]

export const AUDIT_TYPES = [
  'create',
  'update',
  'delete',
  'schedule',
  'cancel',
  'status',
  'settings',
  'view',
  'save',
  'click',
] as const

export type AuditType = (typeof AUDIT_TYPES)[number]

export type ActivityFeedItem = {
  id: string
  source: 'engagement' | 'audit'
  action: string
  details: string
  time: string
  createdAt: string
  type: string
  actor?: string
  eventType?: string
  profileId?: string | null
}

export type ActivityFeedCounts = {
  events: number
  saves: number
  engagement: number
}

export type ActivityFeedPage = {
  items: ActivityFeedItem[]
  total: number
  skip: number
  limit: number
  counts: ActivityFeedCounts
}

export type ActivityFeedQuery = {
  category?: ActivityCategory
  skip?: number
  limit?: number
}

export type AuditLogEntry = ActivityFeedItem

export type CreateAuditLogPayload = {
  action: string
  details: string
  type: AuditType
  actor?: string | null
  profileId?: string | null
  meta?: Record<string, unknown> | null
}

export type AuditLogListQuery = {
  type?: AuditType
  skip?: number
  limit?: number
}

export type AuditLogListPage = {
  items: AuditLogEntry[]
  total: number
  skip: number
  limit: number
}
