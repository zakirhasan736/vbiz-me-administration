import type { Announcement } from '@/types/announcement'

const LOCK_ACTIONS = new Set(['paused', 'suspended', 'activated'])

/** System rows that should not appear as admin-managed announcement lists. */
export function isSystemGeneratedAnnouncement(notice: Announcement): boolean {
  const meta = notice.meta || {}
  if (meta.channel === 'inbox') return true
  if (meta.source === 'card_notice') return true
  if (meta.category === 'event') return true
  if (meta.kind === 'birthday') return true
  if (meta.action && LOCK_ACTIONS.has(meta.action)) return true
  return false
}

/** One live platform banner — never a card-specific or system row. */
export function isLiveGlobalPublicBanner(notice: Announcement): boolean {
  return (
    notice.status === 'active' &&
    notice.targetType === 'all' &&
    notice.meta?.channel !== 'inbox' &&
    !isSystemGeneratedAnnouncement(notice)
  )
}

/** Global announcement history (active + paused). Deleted rows are already gone. */
export function isGlobalAnnouncementHistory(notice: Announcement): boolean {
  return notice.targetType === 'all' && !isSystemGeneratedAnnouncement(notice)
}

export function isWarningListItem(notice: Announcement, liveBannerId?: string | null): boolean {
  if (isSystemGeneratedAnnouncement(notice)) return false
  if (liveBannerId && notice.id === liveBannerId) return false
  return notice.kind === 'warning' || notice.type === 'warning'
}

export function isNoticeListItem(notice: Announcement, liveBannerId?: string | null): boolean {
  if (isSystemGeneratedAnnouncement(notice)) return false
  if (liveBannerId && notice.id === liveBannerId) return false
  return notice.kind !== 'warning' && notice.type !== 'warning'
}

export function announcementListStatusLabel(notice: Announcement): 'Live' | 'Paused' {
  return notice.status === 'active' ? 'Live' : 'Paused'
}
