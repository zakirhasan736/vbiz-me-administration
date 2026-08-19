import { describe, expect, it } from 'vitest'

import { mapAboutMeItemToListItem } from './mapAboutMe'

describe('mapAboutMeItemToListItem', () => {
  it('decodes HTML entities in About Me pillar titles and descriptions', () => {
    const item = mapAboutMeItemToListItem({
      id: 1,
      title: 'About Me',
      description:
        '<h3>🔹 Visionary &amp; Builder – I create solutions that break the mold</h3>' +
        '<h3>🔹 Sales &amp; Marketing Strategist – I turn attention into action</h3>',
      profile_id: 10,
      post_type_id: 2,
      status: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      featured_image: null,
    })

    expect(item.pillars[0]?.title).toBe('Visionary & Builder')
    expect(item.pillars[1]?.title).toBe('Sales & Marketing Strategist')
  })
})
