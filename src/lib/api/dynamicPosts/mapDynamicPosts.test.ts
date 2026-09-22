import { describe, expect, it } from 'vitest'

import { mapDynamicPostItemToListItem } from './mapDynamicPosts'

describe('mapDynamicPostItemToListItem', () => {
  it('decodes entities in public tab titles and plain metadata', () => {
    expect(
      mapDynamicPostItemToListItem({
        id: 1,
        title: 'Sales &amp; Marketing&#x20;Guide',
        description: '',
        status: '1',
        issuer: 'Smith &amp;amp; Co.',
      }).title
    ).toBe('Sales & Marketing Guide')
  })
  it('keeps rich-text HTML from the public section API', () => {
    const item = mapDynamicPostItemToListItem({
      id: 1,
      title: 'FAQ',
      description:
        '<h1>Heading One</h1><p>A <strong>bold</strong> <em>italic</em> line &amp; <a href="https://example.com">link</a></p><ul><li>Bullet</li></ul><pre><code>code</code></pre>',
      status: '1',
    })

    expect(item.description).toContain('<h1>Heading One</h1>')
    expect(item.description).toContain('<strong>bold</strong>')
    expect(item.description).toContain('<em>italic</em>')
    expect(item.description).toContain('<ul><li>Bullet</li></ul>')
    expect(item.description).toContain('<code>code</code>')
    expect(item.description).toContain('line & ')
  })

  it('preserves a legacy top-level video URL alias', () => {
    const item = mapDynamicPostItemToListItem({ id: 1, title: 'Video', url: 'https://example.com/video' })

    expect(item.generalInfoUrl).toBe('https://example.com/video')
  })

  it('preserves a video URL stored in legacy metadata', () => {
    const item = mapDynamicPostItemToListItem({
      id: 1,
      title: 'Video',
      metas: { video_url: 'https://youtu.be/abc123DEF45' },
    })

    expect(item.generalInfoUrl).toBe('https://youtu.be/abc123DEF45')
  })

  it('maps price and offer price from metas', () => {
    const item = mapDynamicPostItemToListItem({
      id: 1,
      title: 'Widget',
      metas: { price: '$49.99', offer_price: '$39.99' },
    })

    expect(item.price).toBe('$49.99')
    expect(item.offerPrice).toBe('$39.99')
  })
})
