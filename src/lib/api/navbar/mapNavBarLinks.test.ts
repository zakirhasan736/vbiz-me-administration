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
})
