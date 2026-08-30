import { describe, expect, it } from 'vitest'
import {
  applyCanonicalPublicNavOrder,
  assemblePublicNavOrder,
  mergeEnabledNavOrder,
  shouldPreserveCustomNavOrder,
} from './publicNavOrder'

describe('canonical public nav order', () => {
  it('keeps relative order when a canonical tab is missing', () => {
    expect(
      applyCanonicalPublicNavOrder(['home', 'about', 'mission', 'services', 'gallery', 'videos', 'bbb', 'faq'])
    ).toEqual(['home', 'about', 'mission', 'services', 'gallery', 'videos', 'bbb', 'faq', 'public-cards', 'my-info'])
  })

  it('orders selected tabs by the default catalog and skips missing ones', () => {
    expect(
      applyCanonicalPublicNavOrder(['home', 'education', 'faq', 'services', 'gallery', 'reviews', 'videos', 'blog'])
    ).toEqual([
      'home',
      'about',
      'services',
      'gallery',
      'videos',
      'reviews',
      'faq',
      'education',
      'blog',
      'public-cards',
      'my-info',
    ])
  })

  it('puts unknown extras after catalog tabs and pins Public Cards then My Info', () => {
    expect(applyCanonicalPublicNavOrder(['home', 'contact-us', 'services', 'skills'])).toEqual([
      'home',
      'about',
      'services',
      'skills',
      'contact-us',
      'public-cards',
      'my-info',
    ])
  })

  it('preserves a customized middle order while still pinning the last two tabs', () => {
    expect(assemblePublicNavOrder(['faq', 'services', 'home', 'about'], { preserveCustom: true })).toEqual([
      'faq',
      'services',
      'home',
      'about',
      'public-cards',
      'my-info',
    ])
  })

  it('merges enabled tabs that were missing from the saved order', () => {
    expect(mergeEnabledNavOrder(['home', 'about', 'faq'], ['services', 'videos', 'bbb'])).toEqual([
      'home',
      'about',
      'services',
      'videos',
      'bbb',
      'faq',
      'public-cards',
      'my-info',
    ])
  })

  it('preserves the michaelangelo-casanova-2 slug', () => {
    expect(shouldPreserveCustomNavOrder('michaelangelo-casanova-2')).toBe(true)
    expect(shouldPreserveCustomNavOrder('other-card')).toBe(false)
    expect(shouldPreserveCustomNavOrder('other-card', true)).toBe(true)
  })
})
