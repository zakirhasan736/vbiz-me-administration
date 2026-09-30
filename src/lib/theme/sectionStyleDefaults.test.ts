import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import { buildPreviewMatchedThemeConfig, resetBrandThemeColors } from '@/lib/theme/resolveCardTheme'
import {
  clearOneSectionStyleOverride,
  deriveBannerMode,
  deriveContentCardMode,
  deriveTopNavBarMode,
  patchSectionStyleMode,
  resolveBannerStyle,
} from '@/lib/theme/sectionStyleDefaults'
import { describe, expect, it } from 'vitest'

describe('sectionStyleDefaults', () => {
  const stock = getDefaultThemeConfig('v3')
  const dark = stock.colors.dark

  it('derives banner defaults from brand accent/secondary', () => {
    const banner = deriveBannerMode(dark, 'dark')
    expect(banner.variant).toBe('gradient')
    expect(banner.gradientFrom).toBe(dark.accent)
    expect(banner.bg).toBe(dark.secondary)
  })

  it('content card titles stay readable on surface', () => {
    const card = deriveContentCardMode(dark)
    expect(card.bg).toBe(dark.surface)
    expect(card.title).toBeTruthy()
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
    expect(resolved.variant).toBe('gradient')
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

  it('derives top navbar dark gradient and light solid defaults', () => {
    const darkNav = deriveTopNavBarMode(dark, 'dark')
    expect(darkNav.variant).toBe('gradient')
    expect(darkNav.gradientFrom).toBe(dark.primary)
    expect(darkNav.gradientTo).toBe(dark.secondary)
    expect(darkNav.border).toBe(dark.accent)

    const lightNav = deriveTopNavBarMode(stock.colors.light, 'light')
    expect(lightNav.variant).toBe('solid')
    expect(lightNav.bg).toBe('#ffffff')
    expect(lightNav.item).toBe(stock.colors.light.primary)
    expect(lightNav.border).toBe(stock.colors.light.primary)
  })
})
