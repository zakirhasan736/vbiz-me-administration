import { describe, expect, it } from 'vitest'

import { mapApiPostsToSectionPosts, sectionPostsToSyncItems } from './vcardPostsSync'

describe('See Products price sync', () => {
  it('writes price and offer_price into metas for DB persistence', () => {
    const [item] = sectionPostsToSyncItems([
      {
        id: 'local_1',
        title: 'Widget',
        description: 'Nice',
        url: 'https://example.com/p',
        featuredImage: '',
        date: '',
        rating: '',
        location: '',
        price: '$49.99',
        offerPrice: '$39.99',
        active: true,
      },
    ])

    expect(item.metas?.price).toBe('$49.99')
    expect(item.metas?.offer_price).toBe('$39.99')
  })

  it('persists cleared featured images as empty string and drops document stubs', () => {
    const [item] = sectionPostsToSyncItems([
      {
        id: 'local_2',
        title: 'Cleared media',
        description: '',
        url: '',
        featuredImage: '',
        date: '',
        rating: '',
        location: '',
        price: '',
        offerPrice: '',
        active: true,
        metas: {
          documents: JSON.stringify([{ url: 'https://cdn.example.com/old.jpg', name: 'document' }]),
        },
      },
    ])

    expect(item.featuredImage).toBe('')
    expect(item.featuredImage).not.toBeUndefined()
    expect(item.documents).toEqual([])
  })

  it('reads price and offer_price back from API metas', () => {
    const [item] = mapApiPostsToSectionPosts([
      {
        id: 'prod_1',
        title: 'Widget',
        description: '',
        status: '1',
        metas: [
          { metaKey: 'price', metaValue: '$49.99' },
          { metaKey: 'offer_price', metaValue: '$39.99' },
        ],
      },
    ])

    expect(item.price).toBe('$49.99')
    expect(item.offerPrice).toBe('$39.99')
  })
})
