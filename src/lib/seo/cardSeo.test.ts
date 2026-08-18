import {
  MAX_SEO_DESCRIPTION_LENGTH,
  MAX_SEO_KEYWORDS,
  MAX_SEO_TITLE_LENGTH,
  SEO_FIXED_KEYWORDS,
  normalizeCardSeo,
  normalizeCardSeoPayload,
  normalizeSeoKeywords,
  parseSeoSettings,
  seoToApiSettings,
} from '@/lib/seo/cardSeo'
import { describe, expect, it } from 'vitest'

describe('card SEO normalization', () => {
  it('keeps the five required terms first, deduplicates, and caps the list at ten', () => {
    const keywords = normalizeSeoKeywords([
      'Custom service',
      'VBIZME',
      'local service',
      'another phrase',
      'fourth phrase',
      'fifth phrase',
      'sixth phrase',
    ])

    expect(keywords).toEqual([
      ...SEO_FIXED_KEYWORDS,
      'Custom service',
      'local service',
      'another phrase',
      'fourth phrase',
      'fifth phrase',
    ])
    expect(keywords).toHaveLength(MAX_SEO_KEYWORDS)
  })

  it('clamps metadata lengths and round-trips API settings', () => {
    const seo = normalizeCardSeo({
      metaTitle: 't'.repeat(MAX_SEO_TITLE_LENGTH + 10),
      metaDescription: 'd'.repeat(MAX_SEO_DESCRIPTION_LENGTH + 10),
      metaKeywords: ['web design'],
    })
    const parsed = parseSeoSettings(seoToApiSettings(seo))

    expect(parsed.metaTitle).toHaveLength(MAX_SEO_TITLE_LENGTH)
    expect(parsed.metaDescription).toHaveLength(MAX_SEO_DESCRIPTION_LENGTH)
    expect(parsed.metaKeywords).toContain('web design')
    expect(parsed.metaKeywords.slice(0, SEO_FIXED_KEYWORDS.length)).toEqual([...SEO_FIXED_KEYWORDS])
  })

  it('maps backend AI keywords into the editor SEO shape', () => {
    const seo = normalizeCardSeoPayload({
      metaTitle: 'AI title',
      metaDescription: 'AI description',
      keywords: ['high intent service'],
    })

    expect(seo.metaTitle).toBe('AI title')
    expect(seo.metaDescription).toBe('AI description')
    expect(seo.metaKeywords).toContain('high intent service')
  })
})
