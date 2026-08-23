import { describe, expect, it } from 'vitest'
import { AI_ASSISTANCE_ADDON_PRICE_USD, isAiAssistanceDefaultEnabledSlug, isAiAssistanceEnabled } from './aiAssistance'
import { entitlementsFromFeatures } from './packageAccess'

describe('AI Assistance premium lock', () => {
  it('keeps AI Assistance off unless explicitly enabled', () => {
    expect(isAiAssistanceEnabled(undefined)).toBe(false)
    expect(isAiAssistanceEnabled('0')).toBe(false)
    expect(isAiAssistanceEnabled('1')).toBe(true)
  })

  it('defaults michaelangelo-casanova-2 to enabled', () => {
    expect(isAiAssistanceDefaultEnabledSlug('Michaelangelo-Casanova-2')).toBe(true)
    expect(isAiAssistanceEnabled('0', 'michaelangelo-casanova-2')).toBe(true)
    expect(isAiAssistanceEnabled(false, 'other-card')).toBe(false)
  })

  it('locks allow_ai_assistance when the package flag is missing', () => {
    const access = entitlementsFromFeatures([{ featureKey: 'allow_seo', featureValue: '1' }], true)
    expect(access.allow_ai_assistance).toBe(false)
    expect(access.allow_seo).toBe(true)
    expect(AI_ASSISTANCE_ADDON_PRICE_USD).toBe(10)
  })
})
