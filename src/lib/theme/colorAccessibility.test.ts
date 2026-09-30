import {
  contrastRatio,
  ensureReadableText,
  suggestAccentFromPrimary,
  suggestBrandCompanions,
  suggestSecondaryFromPrimary,
  visibilityScore,
} from '@/lib/theme/colorAccessibility'
import { describe, expect, it } from 'vitest'

describe('colorAccessibility', () => {
  it('scores high contrast pairs near 100', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeGreaterThan(20)
    expect(visibilityScore('#ffffff', '#000000')).toBe(100)
  })

  it('ensureReadableText falls back when preferred fails', () => {
    expect(ensureReadableText('#ffffff', '#f5f5f5')).toBe('#0b0b0d')
    expect(ensureReadableText('#0b0b0d', '#111111')).toBe('#ffffff')
    expect(ensureReadableText('#ffffff', '#111111')).toBe('#111111')
  })

  it('suggests companions with usable contrast on primary', () => {
    const primary = '#eab308'
    const secondary = suggestSecondaryFromPrimary(primary, 'dark')
    const accent = suggestAccentFromPrimary(primary, 'dark')
    expect(secondary).toMatch(/^#/)
    expect(accent).toMatch(/^#/)
    expect(contrastRatio(secondary, primary)).toBeGreaterThanOrEqual(3)
    const companions = suggestBrandCompanions(primary, '#09090b', 'dark')
    expect(companions.secondary).toBe(secondary)
    expect(companions.onPrimary).toMatch(/^#/)
  })
})
