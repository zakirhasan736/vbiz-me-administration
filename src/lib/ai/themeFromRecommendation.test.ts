import {
  applyThemeRecommendationToConfig,
  describeBrandThemeSource,
  normalizeBrandHex,
  shouldApplyBrandThemeConfig,
} from '@/lib/ai/themeFromRecommendation'
import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import { describe, expect, it } from 'vitest'

describe('themeFromRecommendation', () => {
  it('normalizes 3-digit hex', () => {
    expect(normalizeBrandHex('#abc')).toBe('#aabbcc')
  })

  it('applies website colors and ignores suggestion-only', () => {
    expect(shouldApplyBrandThemeConfig({ source: 'suggestion', light: { primary: '#112233' } })).toBe(false)
    expect(shouldApplyBrandThemeConfig({ source: 'website', light: { primary: '#112233' } })).toBe(true)

    const next = applyThemeRecommendationToConfig(getDefaultThemeConfig('v3'), {
      source: 'website',
      light: { primary: '#112233', secondary: '#0a0a0a', accent: '#cca43b' },
      dark: { primary: '#aabbcc', secondary: '#e2e8f0', accent: '#cca43b' },
    })
    expect(next?.colors.light.primary).toBe('#112233')
    expect(next?.colors.dark.primary).toBe('#aabbcc')
    expect(applyThemeRecommendationToConfig(getDefaultThemeConfig('v3'), { source: 'suggestion' })).toBeNull()
  })

  it('describes brand source for the launch checklist', () => {
    expect(describeBrandThemeSource({ source: 'document', light: { primary: '#123456' } })).toMatch(/PDF/)
    expect(describeBrandThemeSource(null)).toMatch(/default Global Color/)
  })
})
