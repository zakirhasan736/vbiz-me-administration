import {
  markAllNotificationsRead,
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
})
