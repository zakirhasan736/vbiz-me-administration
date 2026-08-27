import { describe, expect, it } from 'vitest'

import { mapNavBarLinks } from './mapNavBarLinks'

describe('mapNavBarLinks', () => {
  it('decodes public tab labels while preserving the API section name', () => {
    const items = mapNavBarLinks({
      post_types: [
        {
          id: 12,
          name: 'Sales &amp; Marketing',
          title: 'Sales &amp; Marketing&#x20;Resources',
          status: '1',
          type_id: 'custom',
          type: 'custom',
        },
      ],
    })

    expect(items[0]?.displayLabel).toBe('Sales & Marketing Resources')
    expect(items[0]?.apiSectionName).toBe('Sales &amp; Marketing')
  })

  it('keeps the default public tab sequence when some tabs are missing', () => {
    const items = mapNavBarLinks({
      post_types: [
        { id: 'faq', name: 'Faq', title: 'FAQ', status: '1', type_id: 'faq' },
        { id: 'videos', name: 'video', title: 'Videos', status: '1', type_id: 'video' },
        { id: 'home', name: 'Home', title: 'Home', status: '1', type_id: 'home' },
        { id: 'reviews', name: 'reviews', title: 'Reviews', status: '1', type_id: 'reviews' },
        { id: 'services', name: 'services', title: 'Services', status: '1', type_id: 'services' },
      ],
    })

    expect(items.map((item) => item.id)).toEqual(['home', 'services', 'videos', 'reviews', 'faq'])
  })
})
