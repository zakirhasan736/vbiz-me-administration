import { describe, expect, it } from 'vitest'
import { normalizeNavOrderWithPinnedEnds } from './createCardTabs'

describe('create-card tab ordering', () => {
  it('preserves reordered Personal and About positions while keeping utility tabs last', () => {
    expect(normalizeNavOrderWithPinnedEnds(['skills', 'home', 'faq', 'about', 'my-info', 'public-cards'])).toEqual([
      'skills',
      'home',
      'about',
      'faq',
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
