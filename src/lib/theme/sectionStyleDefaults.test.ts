import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import { buildPreviewMatchedThemeConfig, resetBrandThemeColors } from '@/lib/theme/resolveCardTheme'
import {
  buildSoftBannerGradient,
  canonicalCssColor,
  clearOneSectionStyleOverride,
  deriveBannerMode,
  deriveContentCardMode,
  deriveTopNavBarMode,
  patchSectionStyleMode,
  resolveBannerStyle,
} from '@/lib/theme/sectionStyleDefaults'
import { describe, expect, it } from 'vitest'

describe('canonicalCssColor', () => {
  it('accepts a pasted hex with or without a hash and keeps short hex until blur', () => {
    expect(canonicalCssColor('A5D49B')).toBe('#a5d49b')
    expect(canonicalCssColor('#A5D49B')).toBe('#a5d49b')
    expect(canonicalCssColor('#fff')).toBeNull()
    expect(canonicalCssColor('#fff', true)).toBe('#ffffff')
    expect(canonicalCssColor('rgb(255, 64, 255)')).toBe('#ff40ff')
  })
})

describe('sectionStyleDefaults', () => {
  const stock = getDefaultThemeConfig('v3')
  const dark = stock.colors.dark

  it('derives banner solid defaults and keeps soft gradient tokens for when gradient is selected', () => {
    const banner = deriveBannerMode(dark, 'dark')
    expect(banner.variant).toBe('solid')
    expect(banner.bg).toBe(dark.secondary)
    expect(banner.gradientFrom).toContain('0.45')
    expect(banner.gradientTo).toContain('0.85')
    expect(banner.border).toContain('0.35')
    expect(banner.titleStyle).toBe('smart')
    expect(banner.titleGradientFrom).toBe(dark.primary)
    expect(banner.titleGradientTo).toBe(dark.accent)
    const gradient = buildSoftBannerGradient(banner.gradientFrom || '', banner.gradientTo || '')
    expect(gradient).toContain('13%')
    expect(gradient).toContain('45%')
    expect(gradient).toContain('85%')
  })

  it('content card titles stay readable on surface', () => {
    const card = deriveContentCardMode(dark)
    expect(card.bg).toBe(dark.surface)
    expect(card.title).toBeTruthy()
    expect(card.description?.toLowerCase()).not.toBe('#1a1a1a')
  })

  it('keeps a content-card color the owner picked, including a dark color on a dark card', () => {
    const card = deriveContentCardMode(dark, {
      bg: dark.surface,
      title: '#1a1a1a',
      text: '#ff40ff',
      description: '#1a1a1a',
    })
    expect(card.title?.toLowerCase()).toBe('#1a1a1a')
    expect(card.text?.toLowerCase()).toBe('#ff40ff')
    expect(card.description?.toLowerCase()).toBe('#1a1a1a')
  })

  it('keeps black description on light content cards', () => {
    const light = stock.colors.light
    const card = deriveContentCardMode(light, {
      bg: '#ffffff',
      description: '#1a1a1a',
    })
    expect(card.description?.toLowerCase()).toBe('#1a1a1a')
  })

  it('publishes Content Cards panel colors into public stylesheet vars', async () => {
    const { buildCardThemeStyleSheet } = await import('@/lib/theme/cardThemeCssVars')
    const patched = patchSectionStyleMode(stock, 'contentCard', 'dark', {
      bg: '#112233',
      title: '#abcdef',
      description: '#fedcba',
    }) as typeof stock
    const css = buildCardThemeStyleSheet(patched, 'dark')
    expect(css).toContain('--vbiz-content-card-bg: #112233')
    expect(css).toContain('--vbiz-content-card-title: #abcdef')
    expect(css).toContain('--vbiz-content-card-desc: #fedcba')
    expect(css).toContain('.vbiz-content-card .vbiz-description')
    expect(css).toContain('var(--vbiz-content-card-desc')
    expect(css).toContain('var(--vbiz-review-text, var(--vbiz-text))')
    expect(css).toContain('var(--vbiz-faq-answer-fg, var(--vbiz-text))')
    expect(css).not.toContain('.vcard-faq-answer {\n  color: #000000')
  })

  it('patch + reset section override round-trips', () => {
    const patched = patchSectionStyleMode(stock, 'contentCard', 'dark', {
      bg: '#112233',
      title: '#ffffff',
    }) as typeof stock
    expect(patched.components.contentCard?.dark?.bg).toBe('#112233')
    const cleared = clearOneSectionStyleOverride(patched, 'contentCard') as typeof stock
    expect(cleared.components.contentCard).toBeUndefined()
    const resolved = resolveBannerStyle(dark, 'dark', patched.components.sectionBanner)
    expect(resolved.variant).toBe('solid')
  })

  it('global reset clears section overrides and restores palette', () => {
    const withOverride = patchSectionStyleMode(stock, 'faqItem', 'light', {
      questionBg: '#abcdef',
    }) as typeof stock
    const reset = resetBrandThemeColors(withOverride, 'v3')
    expect(reset.components.faqItem).toBeUndefined()
    expect(reset.components.sectionBanner).toBeUndefined()
    expect(reset.colors.dark).toEqual(stock.colors.dark)
  })

  it('preview-matched reset matches public merge path', () => {
    const theme = {
      primaryColor: stock.colors.dark.primary,
      secondaryColor: stock.colors.dark.secondary,
      accentColor: stock.colors.dark.accent,
    }
    const matched = buildPreviewMatchedThemeConfig(stock, theme, { profileTemplate: 'v3' }, 'v3')
    expect(matched.colors.dark.primary).toBe(stock.colors.dark.primary)
    expect(matched.components.contentCard).toBeUndefined()
  })

  it('resolveCardThemeConfig round-trips extended section style JSON', async () => {
    const { resolveCardThemeConfig } = await import('@/lib/theme/resolveCardTheme')
    const raw = {
      version: 1,
      colors: stock.colors,
      components: {
        button: stock.components.button,
        socialIcon: stock.components.socialIcon,
        sectionBanner: { dark: { variant: 'solid', bg: '#0f2c4d', title: '#ffffff' } },
        contentCard: { light: { bg: '#fafafa', title: '#111111' } },
        reviewCard: { dark: { star: '#eab308', cardBg: '#0b1626' } },
        faqItem: { dark: { questionBg: '#0b1626', answerFg: '#a1a1aa' } },
        topNavBar: { dark: { variant: 'solid', bg: '#eed677', item: '#0f2c4d', border: '#cca43b' } },
      },
      appearance: stock.appearance,
    }
    const resolved = resolveCardThemeConfig(raw, 'v3')
    expect(resolved.components.sectionBanner?.dark?.variant).toBe('solid')
    expect(resolved.components.contentCard?.light?.bg).toBe('#fafafa')
    expect(resolved.components.reviewCard?.dark?.star).toBe('#eab308')
    expect(resolved.components.faqItem?.dark?.questionBg).toBe('#0b1626')
    expect(resolved.components.topNavBar?.dark?.variant).toBe('solid')
    expect(resolved.components.topNavBar?.dark?.bg).toBe('#eed677')
  })

  it('derives top navbar solid defaults from Secondary bar + readable brand icons (not page surface)', () => {
    const darkNav = deriveTopNavBarMode(dark, 'dark')
    expect(darkNav.variant).toBe('solid')
    expect(darkNav.bg).toBe(dark.secondary)
    expect(String(darkNav.bg).toLowerCase()).not.toBe('#0b1626')
    expect(darkNav.gradientFrom).toBe(dark.primary)
    expect(darkNav.gradientTo).toBe(dark.secondary)
    expect(String(darkNav.item).toLowerCase()).toBe(dark.primary.toLowerCase())

    const lightNav = deriveTopNavBarMode(stock.colors.light, 'light')
    expect(lightNav.variant).toBe('solid')
    expect(String(lightNav.bg).toLowerCase()).toBe((stock.colors.light.background || '#ffffff').toLowerCase())
    // Gold primary on white often fails contrast → Secondary navy is used for icons.
    expect(String(lightNav.item).toLowerCase()).toBe(stock.colors.light.secondary.toLowerCase())
  })

  it('ignores legacy dark surface snapshot so Theme Colors re-flow into Plane bg', () => {
    const darkNav = deriveTopNavBarMode(dark, 'dark', { variant: 'solid', bg: '#0b1626' })
    expect(darkNav.bg).toBe(dark.secondary)
    expect(darkNav.variant).toBe('solid')
  })
})
