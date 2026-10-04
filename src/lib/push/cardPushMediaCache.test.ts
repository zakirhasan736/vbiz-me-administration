import { afterEach, describe, expect, it } from 'vitest'
import {
  CARD_PUSH_MEDIA_LAST_KEY,
  CARD_PUSH_MEDIA_STORAGE_PREFIX,
  enrichPushPayloadWithCardMedia,
  readCardPushMediaSync,
} from './cardPushMediaCache'

describe('cardPushMediaCache identity isolation', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('does not fall back to last-visited card when a slug is requested', () => {
    localStorage.setItem(
      `${CARD_PUSH_MEDIA_STORAGE_PREFIX}${CARD_PUSH_MEDIA_LAST_KEY}`,
      JSON.stringify({
        slug: 'mcasanova',
        businessName: 'Michaelangelo Casanova',
        avatarImageUrl: 'https://cdn.example.com/m.jpg',
        avatarUrl: 'https://cdn.example.com/m.jpg',
        avatarVideoUrl: '',
        icon: 'https://cdn.example.com/m.jpg',
        updatedAt: new Date().toISOString(),
      })
    )

    expect(readCardPushMediaSync('other-card')).toBeNull()
  })

  it('keeps payload businessName/slug when enriching icons', () => {
    localStorage.setItem(
      `${CARD_PUSH_MEDIA_STORAGE_PREFIX}acme`,
      JSON.stringify({
        slug: 'acme',
        businessName: 'Acme Plumbing',
        avatarImageUrl: 'https://cdn.example.com/acme.jpg',
        avatarUrl: 'https://cdn.example.com/acme.jpg',
        avatarVideoUrl: '',
        icon: 'https://cdn.example.com/acme.jpg',
        updatedAt: new Date().toISOString(),
      })
    )

    const enriched = enrichPushPayloadWithCardMedia({
      slug: 'acme',
      businessName: 'Acme Plumbing',
      title: 'Profile updated',
      body: 'Acme Plumbing updated their profile.',
      avatarImageUrl: '',
    })

    expect(enriched.slug).toBe('acme')
    expect(enriched.businessName).toBe('Acme Plumbing')
    expect(enriched.avatarImageUrl).toBe('https://cdn.example.com/acme.jpg')
  })
})
