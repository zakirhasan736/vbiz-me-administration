import { designToCssVars, resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import {
  applyEditorSettingsToThemeConfig,
  buildPreviewMatchedThemeConfig,
  resetBrandThemeColors,
} from '@/lib/theme/resolveCardTheme'
import type { DesignSettingsState } from '@/redux/features/designSettings/designSettings.slice'
import { describe, expect, it } from 'vitest'

const designSettings: DesignSettingsState = {
  vcardPrimaryColor: '#eed677',
  vcardAccentColor: '#eed677',
  dashboardAccent: 'amber',
  fontFamily: 'inter',
  profileTemplate: 'v3',
  layoutStyle: 'classic',
  buttonStyle: 'solid',
  cornerStyle: 'round',
}

describe('applyEditorSettingsToThemeConfig', () => {
  it('stamps flat brand onto both modes only when light/dark brand roles match', () => {
    const stock = getDefaultThemeConfig('v2')
    // v2 light/dark share the same primary/secondary/accent roles.
    const matched = {
      ...stock,
      colors: {
        ...stock.colors,
        light: {
          ...stock.colors.light,
          primary: stock.colors.dark.primary,
          secondary: stock.colors.dark.secondary,
          accent: stock.colors.dark.accent,
        },
      },
    }
    const next = applyEditorSettingsToThemeConfig(
      matched,
      {
        primaryColor: '#112233',
        secondaryColor: '#0f2c4d',
        accentColor: '#445566',
      },
      null
    )

    expect(next.colors.light.primary).toBe('#112233')
    expect(next.colors.dark.primary).toBe('#112233')
    expect(next.colors.light.secondary).toBe('#0f2c4d')
    expect(next.colors.dark.secondary).toBe('#0f2c4d')
    expect(next.colors.light.accent).toBe('#445566')
    expect(next.colors.dark.accent).toBe('#445566')
  })

  it('does not stamp flat brand onto both modes when light/dark brands already differ', () => {
    const stock = getDefaultThemeConfig('v3')
    // Stock v3 already has distinct accents; flat editor values only update defaultMode (dark).
    const next = applyEditorSettingsToThemeConfig(
      stock,
      { primaryColor: '#999999', secondaryColor: '#888888', accentColor: '#777777' },
      null
    )
    expect(next.colors.dark.primary).toBe('#999999')
    expect(next.colors.dark.accent).toBe('#777777')
    expect(next.colors.light.primary).toBe(stock.colors.light.primary)
    expect(next.colors.light.accent).toBe(stock.colors.light.accent)
  })

  it('applies template and button style from Card Settings', () => {
    const next = applyEditorSettingsToThemeConfig(getDefaultThemeConfig('v3'), null, {
      profileTemplate: 'v1',
      buttonStyle: 'outline',
      cornerStyle: 'pill',
    })

    expect(next.appearance.profileTemplate).toBe('v1')
    expect(next.appearance.buttonStyle).toBe('outline')
    expect(next.appearance.cornerStyle).toBe('pill')
    expect(next.components.button.primary.style).toBe('outlined')
    expect(next.components.socialIcon.style).toBe('outlined')
  })

  it('stores the selected font on theme_config so public cards can load it', () => {
    const next = applyEditorSettingsToThemeConfig(
      getDefaultThemeConfig('v3'),
      { fontFamily: 'poppins' },
      { buttonShadow: 'strong' }
    )

    expect(next.appearance.fontFamily).toBe('poppins')
    expect(next.appearance.buttonShadow).toBe('strong')
  })
})

describe('resetBrandThemeColors', () => {
  it('restores the full preview palette (brand + surfaces + text) on both modes', () => {
    const stock = getDefaultThemeConfig('v3')
    const customized = applyEditorSettingsToThemeConfig(
      {
        ...stock,
        colors: {
          ...stock.colors,
          dark: {
            ...stock.colors.dark,
            primary: '#111111',
            background: '#ff0000',
            surface: '#00ff00',
            text: '#0000ff',
          },
        },
      },
      { primaryColor: '#111111', secondaryColor: '#222222', accentColor: '#333333' },
      null
    )
    const reset = resetBrandThemeColors(customized, 'v3')
    expect(reset.colors.light).toEqual(stock.colors.light)
    expect(reset.colors.dark).toEqual(stock.colors.dark)
    expect(reset.colors.defaultMode).toBe(stock.colors.defaultMode)
    expect(reset.wallpaper).toEqual(customized.wallpaper)
  })

  it('buildPreviewMatchedThemeConfig matches eye-preview / save merge', () => {
    const stock = getDefaultThemeConfig('v3')
    const theme = {
      primaryColor: stock.colors.dark.primary,
      secondaryColor: stock.colors.dark.secondary,
      accentColor: stock.colors.dark.accent,
    }
    const matched = buildPreviewMatchedThemeConfig(
      {
        ...stock,
        colors: {
          ...stock.colors,
          dark: { ...stock.colors.dark, background: '#ff0000' },
        },
      },
      theme,
      { profileTemplate: 'v3' },
      'v3'
    )
    const preview = applyEditorSettingsToThemeConfig(resetBrandThemeColors(stock, 'v3'), theme, {
      profileTemplate: 'v3',
    })
    expect(matched.colors.dark.background).toBe(stock.colors.dark.background)
    expect(matched.colors.dark.primary).toBe(preview.colors.dark.primary)
    expect(matched.colors.dark.accent).toBe(preview.colors.dark.accent)
  })
})

describe('resolveProfileDesign', () => {
  it('prefers live theme colors over stale theme_config', () => {
    const themeConfig = applyEditorSettingsToThemeConfig(
      getDefaultThemeConfig('v3'),
      {
        primaryColor: '#aaaaaa',
        accentColor: '#bbbbbb',
      },
      null
    )

    const design = resolveProfileDesign(
      designSettings,
      { primaryColor: '#00ff00', accentColor: '#0000ff', fontFamily: 'outfit' },
      { profileTemplate: 'v3', buttonStyle: 'solid', cornerStyle: 'round', layoutStyle: 'classic' },
      { themeConfig }
    )

    expect(design.primaryColor).toBe('#00ff00')
    expect(design.accentColor).toBe('#0000ff')
    expect(design.fontFamily).toBe('outfit')
  })

  it('does not freeze brand colors onto inline vars so light/dark can swap surfaces', () => {
    const vars = designToCssVars({
      primaryColor: '#112233',
      secondaryColor: '#0f2c4d',
      accentColor: '#445566',
      fontFamily: 'poppins',
      profileTemplate: 'v3',
      layoutStyle: 'classic',
      buttonStyle: 'solid',
      cornerStyle: 'round',
      darkMode: true,
    }) as Record<string, string>

    expect(vars['--vbiz-primary']).toBeUndefined()
    expect(vars['--vbiz-accent']).toBeUndefined()
    expect(vars['--font-sans']).toContain('Poppins')
    expect(vars['--font-heading']).toContain('Poppins')
  })
})
