import { describe, expect, it } from 'vitest'

import {
  announcementListStatusLabel,
  isGlobalAnnouncementHistory,
  isLiveGlobalPublicBanner,
  isNoticeListItem,
  isSystemGeneratedAnnouncement,
  isWarningListItem,
} from '@/lib/announcementListFilters'
import type { Announcement } from '@/types/announcement'

function notice(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 'a1',
    kind: 'announcement',
    type: 'info',
    title: 'Info announcement',
    body: 'Hello',
    status: 'active',
    targetType: 'all',
    targetEmails: [],
    startsAt: null,
    endsAt: null,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
    ...overrides,
  }
}

describe('announcement list filters', () => {
  it('treats only the active global row as the live public banner', () => {
    expect(isLiveGlobalPublicBanner(notice())).toBe(true)
    expect(isLiveGlobalPublicBanner(notice({ status: 'archived' }))).toBe(false)
    expect(isLiveGlobalPublicBanner(notice({ targetType: 'specific' }))).toBe(false)
    expect(isLiveGlobalPublicBanner(notice({ meta: { source: 'card_notice' } }))).toBe(false)
  })

  it('keeps paused globals in the recent-publishes list and drops system rows', () => {
    expect(isGlobalAnnouncementHistory(notice({ status: 'archived' }))).toBe(true)
    expect(isGlobalAnnouncementHistory(notice({ meta: { category: 'event' } }))).toBe(false)
    expect(isGlobalAnnouncementHistory(notice({ meta: { source: 'card_notice' } }))).toBe(false)
    expect(isSystemGeneratedAnnouncement(notice({ meta: { action: 'paused' } }))).toBe(true)
  })

  it('excludes the current live banner from warning and notice lists', () => {
    const live = notice({ id: 'live', kind: 'warning', type: 'warning' })
    const olderWarning = notice({ id: 'old', kind: 'warning', type: 'warning', status: 'archived' })
    const info = notice({ id: 'info' })

    expect(isWarningListItem(live, 'live')).toBe(false)
    expect(isWarningListItem(olderWarning, 'live')).toBe(true)
    expect(isNoticeListItem(info, 'live')).toBe(true)
    expect(isNoticeListItem(live, 'live')).toBe(false)
    expect(announcementListStatusLabel(olderWarning)).toBe('Paused')
  })
})
