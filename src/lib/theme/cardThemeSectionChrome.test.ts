import { CARD_THEME_UTILITY_CSS } from '@/lib/theme/cardThemeCssVars'
import { describe, expect, it } from 'vitest'

describe('content-tab section chrome tokens', () => {
  it('defines section pills with secondary fill and accent text (not accent fill)', () => {
    expect(CARD_THEME_UTILITY_CSS).toContain('.vbiz-section-pill')
    expect(CARD_THEME_UTILITY_CSS).toContain('background-color: var(--vbiz-secondary, var(--vbiz-primary))')
    expect(CARD_THEME_UTILITY_CSS).toMatch(/\.vbiz-profile-root \.vbiz-section-pill[\s\S]*?color: var\(--vbiz-accent\)/)
    expect(CARD_THEME_UTILITY_CSS).not.toMatch(
      /\.vbiz-profile-root \.vbiz-section-pill\s*\{[^}]*background-color: var\(--vbiz-accent\)/
    )
  })

  it('keeps text links on accent for highlight-only chrome', () => {
    expect(CARD_THEME_UTILITY_CSS).toContain('.vbiz-link')
    expect(CARD_THEME_UTILITY_CSS).toContain('color: var(--vbiz-accent) !important')
  })
})
