import type { ClientItem } from '@/interfaces/api/clients.interface'
import { describe, expect, it } from 'vitest'

import { mapClientItemToListItem } from './mapClients'

function client(overrides: Partial<ClientItem>): ClientItem {
  return {
    id: 'client-1',
    title: 'Partner',
    description: null,
    post_type_id: 2,
    created_at: '2026-01-01T00:00:00.000Z',
    status: 1,
    featured_image: null,
    review_link: { url: '', has_link: false },
    ...overrides,
  }
}

describe('mapClientItemToListItem', () => {
  it('keeps each client featured image independent', () => {
    const first = mapClientItemToListItem(
      client({ id: 'first', featured_image: { url: 'https://cdn.example.com/first.png' } })
    )
    const second = mapClientItemToListItem(
      client({ id: 'second', featured_image: [{ url: 'https://cdn.example.com/second.png' }] })
    )

    expect(first.logo).toBe('https://cdn.example.com/first.png')
    expect(second.logo).toBe('https://cdn.example.com/second.png')
  })

  it('uses that client attachment when featured_image is missing', () => {
    const mapped = mapClientItemToListItem(client({ attachments: [{ url: 'https://cdn.example.com/partner.png' }] }))

    expect(mapped.logo).toBe('https://cdn.example.com/partner.png')
  })

  it('uses the client website url when review_link.has_link is false', () => {
    const mapped = mapClientItemToListItem(
      client({
        review_link: { url: 'https://partner.example', has_link: false },
        general_info_url: 'https://partner.example',
      })
    )

    expect(mapped.linkUrl).toBe('https://partner.example')
  })
})
