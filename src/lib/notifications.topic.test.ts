import {
  listNotifications,
  markAllNotificationsRead,
  notificationMatchesViewer,
  pushNotification,
  resolveNotificationTopic,
  type AppNotification,
} from '@/lib/notifications'
import { beforeEach, describe, expect, it } from 'vitest'

const STORAGE_KEY = 'vbiz_notifications'

function seed(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

describe('notification topic isolation (matrix §14.C)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('prefers explicit topic over category=event', () => {
    expect(
      resolveNotificationTopic({
        category: 'event',
        href: '/vcards/edit/home/p1',
        meta: { topic: 'card' },
      })
    ).toBe('card')
    expect(
      resolveNotificationTopic({
        category: 'event',
        href: '/crm',
        meta: { topic: 'crm' },
      })
    ).toBe('crm')
  })

  it('mark all read on card topic does not clear CRM unread', () => {
    seed([
      {
        id: 'card-1',
        audience: 'single',
        category: 'contact_save',
        title: 'Card saved',
        body: 'x',
        read: false,
        createdAt: new Date().toISOString(),
        meta: { topic: 'card' },
      },
      {
        id: 'crm-1',
        audience: 'single',
        category: 'event',
        title: 'Wish scheduled',
        body: 'y',
        read: false,
        createdAt: new Date().toISOString(),
        meta: { topic: 'crm' },
      },
    ])

    markAllNotificationsRead('single', { topic: 'card' })

    const next = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as AppNotification[]
    expect(next.find((n) => n.id === 'card-1')?.read).toBe(true)
    expect(next.find((n) => n.id === 'crm-1')?.read).toBe(false)
  })

  it('pushNotification stores topic for later filtering', () => {
    const created = pushNotification({
      audience: 'single',
      category: 'system',
      title: '1-on-1 request',
      body: 'Guest asked to meet',
      meta: { topic: 'card', profileId: 'p1' },
    })
    expect(created?.meta?.topic).toBe('card')
    expect(resolveNotificationTopic(created!)).toBe('card')
  })

  it('scopes identity: single/member own card; corporate owner linked cards; never other cards', () => {
    const memberNotice: AppNotification = {
      id: 'n1',
      audience: 'corporate',
      category: 'contact_save',
      title: 'Lead',
      body: 'x',
      read: false,
      createdAt: new Date().toISOString(),
      meta: { topic: 'card', userId: 'julie', profileId: 'julie-card' },
    }
    expect(notificationMatchesViewer(memberNotice, { userId: 'julie', ownedProfileIds: ['julie-card'] })).toBe(true)
    expect(
      notificationMatchesViewer(memberNotice, {
        userId: 'corp-parent',
        ownedProfileIds: ['corp-hq', 'julie-card'],
      })
    ).toBe(true)
    expect(
      notificationMatchesViewer(memberNotice, {
        userId: 'other-corp',
        ownedProfileIds: ['other-hq'],
      })
    ).toBe(false)

    seed([
      memberNotice,
      {
        ...memberNotice,
        id: 'n2',
        audience: 'single',
        meta: { topic: 'crm', userId: 'julie', profileId: 'julie-card' },
      },
    ])
    const crmOnly = listNotifications('single', {
      userId: 'julie',
      ownedProfileIds: ['julie-card'],
      topic: 'crm',
    })
    expect(crmOnly.map((n) => n.id)).toEqual(['n2'])
  })
})
