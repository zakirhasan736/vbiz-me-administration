import type { Announcement } from '@/types/announcement'

const LOCK_ACTIONS = new Set(['paused', 'suspended', 'activated'])

/** Auto system rows — keep these out of admin announcement lists. */
export function isSystemGeneratedAnnouncement(notice: Announcement): boolean {
  const meta = notice.meta || {}
  if (meta.kind === 'birthday') return true
  if (meta.action && LOCK_ACTIONS.has(meta.action)) return true
  if (meta.category === 'event') return true
  return false
}

export function isAdminManagedAnnouncement(notice: Announcement): boolean {
  return !isSystemGeneratedAnnouncement(notice)
}

/** One live platform banner — never a card-specific, scheduled, or system row. */
export function isLiveGlobalPublicBanner(notice: Announcement, now = Date.now()): boolean {
  return (
    notice.status === 'active' &&
    notice.targetType === 'all' &&
    notice.meta?.channel !== 'inbox' &&
    notice.meta?.onlyBackoffice !== '1' &&
    !isUpcomingAnnouncement(notice, now) &&
    !isSystemGeneratedAnnouncement(notice)
  )
}

/** Every admin publish: global, single-card, public, or backoffice-only. */
export function isAnnouncementHistory(notice: Announcement): boolean {
  return isAdminManagedAnnouncement(notice)
}

/** @deprecated Use isAnnouncementHistory — lists now include single-card and backoffice rows. */
export function isGlobalAnnouncementHistory(notice: Announcement): boolean {
  return isAnnouncementHistory(notice)
}

export function isUpcomingAnnouncement(notice: Announcement, now = Date.now()): boolean {
  if (!isAdminManagedAnnouncement(notice) || notice.status !== 'active') return false
  if (!notice.startsAt) return false
  const start = new Date(notice.startsAt).getTime()
  return Number.isFinite(start) && start > now
}

export function isWarningListItem(notice: Announcement, _liveBannerId?: string | null): boolean {
  if (!isAdminManagedAnnouncement(notice)) return false
  return notice.kind === 'warning' || notice.type === 'warning'
}

export function isNoticeListItem(notice: Announcement, _liveBannerId?: string | null): boolean {
  if (!isAdminManagedAnnouncement(notice)) return false
  return notice.kind !== 'warning' && notice.type !== 'warning'
}

export function announcementListStatusLabel(notice: Announcement): 'Live' | 'Upcoming' | 'Paused' {
  if (notice.status !== 'active') return 'Paused'
  if (isUpcomingAnnouncement(notice)) return 'Upcoming'
  return 'Live'
}
