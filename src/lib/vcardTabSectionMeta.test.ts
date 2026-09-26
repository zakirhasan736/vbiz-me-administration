import { describe, expect, it } from 'vitest'

import {
  defaultBannerDescription,
  parseTabSectionMeta,
  resolveSectionBanner,
  serializeTabSectionMeta,
  upsertTabSectionMetaEntry,
} from './vcardTabSectionMeta'

describe('vcardTabSectionMeta', () => {
  it('uses the tab name when banner title is blank', () => {
    expect(
      resolveSectionBanner({
        tabId: 'blog',
        tabName: 'Blog',
        meta: { bannerTitle: '  ' },
      }).title
    ).toBe('Blog')
  })

  it('uses a custom banner title when provided', () => {
    expect(
      resolveSectionBanner({
        tabId: 'blog',
        tabName: 'Blog',
        meta: { bannerTitle: 'Newsroom' },
      }).title
    ).toBe('Newsroom')
  })

  it('shows the default description until the field is customized', () => {
    expect(resolveSectionBanner({ tabId: 'services', tabName: 'Services' }).description).toBe(
      defaultBannerDescription('services')
    )
  })

  it('hides a customized empty description and empty notes', () => {
    const banner = resolveSectionBanner({
      tabId: 'faq',
      tabName: 'Faq',
      meta: { bannerDescription: '', notes: '   ' },
    })
    expect(banner.description).toBe('')
    expect(banner.notes).toBe('')
  })

  it('round-trips stored banner fields', () => {
    const raw = serializeTabSectionMeta(
      upsertTabSectionMetaEntry({}, 'blog', {
        bannerTitle: 'Newsroom',
        bannerDescription: 'Latest writing.',
        notes: 'Please read before booking.',
      })
    )
    const parsed = parseTabSectionMeta(raw)
    expect(parsed.blog).toEqual({
      bannerTitle: 'Newsroom',
      bannerDescription: 'Latest writing.',
      notes: 'Please read before booking.',
    })
  })
})
