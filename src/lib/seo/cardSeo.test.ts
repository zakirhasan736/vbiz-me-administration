import {
  MAX_OWNER_SEO_KEYWORDS,
  MAX_SEO_DESCRIPTION_LENGTH,
  MAX_SEO_KEYWORDS,
  MAX_SEO_TITLE_LENGTH,
  SEO_FIXED_KEYWORDS,
  normalizeCardSeo,
  normalizeCardSeoPayload,
  normalizeSeoKeywords,
  ownerSeoKeywords,
  parseSeoSettings,
  seoToApiSettings,
} from '@/lib/seo/cardSeo'
import { describe, expect, it } from 'vitest'

describe('card SEO normalization', () => {
  it('keeps the five required terms first, hides them from the owner list, and caps owner phrases at ten', () => {
    const keywords = normalizeSeoKeywords([
      'Custom service',
      'VBIZME',
      'local service',
      'another phrase',
      'fourth phrase',
      'fifth phrase',
      'sixth phrase',
    ])

    expect(keywords.slice(0, SEO_FIXED_KEYWORDS.length)).toEqual([...SEO_FIXED_KEYWORDS])
    expect(ownerSeoKeywords(keywords)).toEqual([
      'Custom service',
      'local service',
      'another phrase',
      'fourth phrase',
      'fifth phrase',
      'sixth phrase',
    ])
    expect(ownerSeoKeywords(keywords)).not.toContain('vbizme')
  })

  it('caps stored keywords at five vBiz terms plus ten owner phrases', () => {
    const many = Array.from({ length: 15 }, (_, index) => `phrase ${index + 1}`)
    const keywords = normalizeSeoKeywords(many)
    expect(ownerSeoKeywords(keywords)).toHaveLength(MAX_OWNER_SEO_KEYWORDS)
    expect(keywords).toHaveLength(MAX_SEO_KEYWORDS)
    expect(keywords.slice(0, SEO_FIXED_KEYWORDS.length)).toEqual([...SEO_FIXED_KEYWORDS])
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
    expect(ownerSeoKeywords(parsed.metaKeywords)).toEqual(['web design'])
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
    expect(ownerSeoKeywords(seo.metaKeywords)).toEqual(['high intent service'])
  })
})
