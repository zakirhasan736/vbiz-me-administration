import { describe, expect, it } from 'vitest'
import { normalizeNavOrderWithPinnedEnds } from './createCardTabs'

describe('create-card tab ordering', () => {
  it('sorts selected tabs by default catalog order without enabling missing ones', () => {
    expect(normalizeNavOrderWithPinnedEnds(['skills', 'home', 'faq', 'about', 'my-info', 'public-cards'])).toEqual([
      'home',
      'about',
      'faq',
      'skills',
      'public-cards',
      'my-info',
    ])
  })

  it('restores missing required editor tabs without duplicating them', () => {
    expect(normalizeNavOrderWithPinnedEnds(['faq', 'faq', 'public-cards'])).toEqual([
      'home',
      'about',
      'faq',
      'public-cards',
      'my-info',
    ])
  })
})
