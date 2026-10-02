import { planPushDisplay } from '@/lib/push/notificationDisplay'
import { describe, expect, it } from 'vitest'

describe('push display across devices', () => {
  it('keeps each meeting, repeat view, and save-contact alert visible on iPhone, Mac, Android, and Windows', () => {
    for (const type of ['meeting_alert', 'viewer_return', 'save_contact'] as const) {
      const plan = planPushDisplay({
        type,
        slug: 'acme',
        profileId: 'card-1',
        hasFocusedClient: true,
        now: 1000,
      })
      expect(plan.silent).toBe(false)
      expect(plan.requireInteraction).toBe(true)
      expect(plan.tag).toBe(`vbiz-${type}-card-1-1000`)
      expect(plan.omitRichOptionsOnFailure).toBe(true)
    }
  })

  it('collapses ordinary card updates onto the card tag and stays quiet while the site is focused', () => {
    const focused = planPushDisplay({
      type: 'contact_updates',
      slug: 'acme',
      hasFocusedClient: true,
      now: 1000,
    })
    expect(focused.tag).toBe('vbiz-card-acme')
    expect(focused.silent).toBe(true)
    expect(focused.requireInteraction).toBe(false)

    const background = planPushDisplay({
      type: 'announcement_updates',
      slug: 'acme',
      hasFocusedClient: false,
    })
    expect(background.silent).toBe(false)
  })
})
