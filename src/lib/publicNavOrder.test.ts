import { describe, expect, it } from 'vitest'
import { applyCanonicalPublicNavOrder } from './publicNavOrder'

describe('canonical public nav order', () => {
  it('keeps relative order when a canonical tab is missing', () => {
    expect(
      applyCanonicalPublicNavOrder(['home', 'about', 'mission', 'services', 'gallery', 'videos', 'bbb', 'faq'])
    ).toEqual(['home', 'about', 'mission', 'services', 'gallery', 'videos', 'bbb', 'faq'])
  })

  it('reorders only canonical tabs and leaves other tabs in place', () => {
    expect(
      applyCanonicalPublicNavOrder(['home', 'education', 'faq', 'services', 'gallery', 'reviews', 'videos'])
    ).toEqual(['home', 'education', 'services', 'gallery', 'videos', 'reviews', 'faq'])
  })
})
