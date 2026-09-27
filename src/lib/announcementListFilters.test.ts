import { describe, expect, it } from 'vitest'

import {
  announcementListStatusLabel,
  isAnnouncementHistory,
  isGlobalAnnouncementHistory,
  isLiveGlobalPublicBanner,
  isNoticeListItem,
  isSystemGeneratedAnnouncement,
  isUpcomingAnnouncement,
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
  it('treats only the active global public row as the live public banner', () => {
    expect(isLiveGlobalPublicBanner(notice())).toBe(true)
    expect(isLiveGlobalPublicBanner(notice({ status: 'archived' }))).toBe(false)
    expect(isLiveGlobalPublicBanner(notice({ targetType: 'specific' }))).toBe(false)
    expect(isLiveGlobalPublicBanner(notice({ meta: { onlyBackoffice: '1' } }))).toBe(false)
    expect(isLiveGlobalPublicBanner(notice({ meta: { action: 'paused' } }))).toBe(false)
  })

  it('lists global, single-card, card-notice, and backoffice publishes', () => {
    expect(isAnnouncementHistory(notice({ status: 'archived' }))).toBe(true)
    expect(isAnnouncementHistory(notice({ targetType: 'specific', meta: { profileId: 'p1' } }))).toBe(true)
    expect(isAnnouncementHistory(notice({ meta: { source: 'card_notice', onlyBackoffice: '1' } }))).toBe(true)
    expect(isGlobalAnnouncementHistory(notice({ meta: { onlyBackoffice: '1' } }))).toBe(true)
    expect(isAnnouncementHistory(notice({ meta: { category: 'event' } }))).toBe(false)
    expect(isSystemGeneratedAnnouncement(notice({ meta: { action: 'paused' } }))).toBe(true)
    expect(isSystemGeneratedAnnouncement(notice({ meta: { kind: 'birthday' } }))).toBe(true)
  })

  it('keeps the live banner inside warning and notice lists', () => {
    const live = notice({ id: 'live', kind: 'warning', type: 'warning' })
    const olderWarning = notice({ id: 'old', kind: 'warning', type: 'warning', status: 'archived' })
    const info = notice({ id: 'info' })
    const cardNotice = notice({
      id: 'card',
      targetType: 'specific',
      meta: { source: 'card_notice', profileId: 'p1', onlyBackoffice: '1' },
    })

    expect(isWarningListItem(live, 'live')).toBe(true)
    expect(isWarningListItem(olderWarning, 'live')).toBe(true)
    expect(isNoticeListItem(info, 'live')).toBe(true)
    expect(isNoticeListItem(cardNotice, 'live')).toBe(true)
    expect(announcementListStatusLabel(olderWarning)).toBe('Paused')
  })

  it('marks future startsAt rows as upcoming', () => {
    const upcoming = notice({ startsAt: '2099-01-01T00:00:00.000Z' })
    expect(isUpcomingAnnouncement(upcoming, Date.parse('2026-09-27T00:00:00.000Z'))).toBe(true)
    expect(announcementListStatusLabel(upcoming)).toBe('Upcoming')
  })
})
