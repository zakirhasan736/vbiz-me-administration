import { describe, expect, it } from 'vitest'

import type { PublicCardsResponse } from '@/interfaces/api/publicCards'

import { mapPublicCardToListItem, normalizePublicCardsResponse } from './mapPublicCards'

const card = {
  id: 1,
  name: 'Smith &amp; Jones',
  slug: 'smith-jones',
  profession: 'Sales&#x20;&amp;&#x20;Marketing',
  profession_id: 2,
  image: '',
  image_type: 'image',
  is_video: false,
  profile_url: '/v/smith-jones',
}

describe('public card text mapping', () => {
  it('decodes directory card names and professions', () => {
    expect(mapPublicCardToListItem(card)).toMatchObject({
      name: 'Smith & Jones',
      profession: 'Sales & Marketing',
    })
  })

  it('decodes directory filters and pagination labels', () => {
    const paginated = {
      current_page: 1,
      data: [card],
      first_page_url: '',
      from: 1,
      last_page: 1,
      last_page_url: '',
      links: [{ url: null, label: '&laquo;&#x20;Previous', active: false }],
      next_page_url: null,
      path: '',
      per_page: 12,
      prev_page_url: null,
      to: 1,
      total: 1,
    }
    const response: PublicCardsResponse = {
      success: true,
      data: paginated,
      dropdowns: { professions: [{ id: 2, name: 'Sales &amp; Marketing' }] },
    }

    const result = normalizePublicCardsResponse(response)
    expect(result.dropdowns?.professions?.[0]?.name).toBe('Sales & Marketing')
    expect(result.pagination.links?.[0]?.label).toBe('« Previous')
  })

  it('tolerates Express payloads without Laravel links', () => {
    const response = {
      success: true,
      data: {
        current_page: 1,
        data: [{ ...card, id: 'cuid_abc' }],
        last_page: 1,
        per_page: 12,
        total: 1,
      },
      dropdowns: { professions: [{ id: 'prof_1', name: 'Advisor' }] },
    } as PublicCardsResponse

    const result = normalizePublicCardsResponse(response)
    expect(result.cards).toHaveLength(1)
    expect(result.cards[0]?.id).toBe('cuid_abc')
    expect(result.pagination.links?.length).toBeGreaterThan(0)
    expect(result.pagination.total).toBe(1)
  })
})
