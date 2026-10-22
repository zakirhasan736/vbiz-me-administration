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

  it('overwrites default solid component styles when Template Settings choose glass', () => {
    const stock = getDefaultThemeConfig('v3')
    expect(stock.components.button.primary.style).toBe('filled')
    const next = applyEditorSettingsToThemeConfig(stock, null, {
      buttonStyle: 'glass',
      cornerStyle: 'soft',
      buttonShadow: 'strong',
    })
    expect(next.appearance.buttonStyle).toBe('glass')
    expect(next.appearance.cornerStyle).toBe('soft')
    expect(next.appearance.buttonShadow).toBe('strong')
    expect(next.components.button.primary.style).toBe('glass')
    expect(next.components.button.secondary.style).toBe('glass')
    expect(next.components.button.accent.style).toBe('glass')
    expect(next.components.socialIcon.style).toBe('glass')
    expect(next.components.socialIcon.cornerRadius).toBe(8)
  })

  it('can toggle button style / corner / shadow back to a previous option', () => {
    const stock = getDefaultThemeConfig('v3')
    const glass = applyEditorSettingsToThemeConfig(stock, null, {
      buttonStyle: 'glass',
      cornerStyle: 'pill',
      buttonShadow: 'hard',
    })
    const back = applyEditorSettingsToThemeConfig(glass, null, {
      buttonStyle: 'solid',
      cornerStyle: 'square',
      buttonShadow: 'none',
    })
    expect(back.appearance.buttonStyle).toBe('solid')
    expect(back.appearance.cornerStyle).toBe('square')
    expect(back.appearance.buttonShadow).toBe('none')
    expect(back.components.button.primary.style).toBe('filled')
    expect(back.components.socialIcon.style).toBe('filled')
    expect(back.components.socialIcon.cornerRadius).toBe(0)
  })

  it('forces all home button fills when Button type is primary or secondary', () => {
    const stock = getDefaultThemeConfig('v3')
    expect(stock.components.button.secondary.colors.light.fill).toBe('secondary')
    const primary = applyEditorSettingsToThemeConfig(stock, null, { buttonType: 'primary' })
    expect(primary.appearance.buttonType).toBe('primary')
    expect(primary.components.button.primary.colors.light.fill).toBe('primary')
    expect(primary.components.button.secondary.colors.light.fill).toBe('primary')
    expect(primary.components.button.accent.colors.light.fill).toBe('primary')
    expect(primary.components.socialIcon.colors.light.fill).toBe('primary')

    const secondary = applyEditorSettingsToThemeConfig(primary, null, { buttonType: 'secondary' })
    expect(secondary.components.button.primary.colors.light.fill).toBe('secondary')
    expect(secondary.components.socialIcon.colors.light.fill).toBe('secondary')

    const reset = applyEditorSettingsToThemeConfig(secondary, null, { buttonType: 'default' })
    expect(reset.components.button.secondary.colors.light.fill).toBe('secondary')
    expect(reset.components.button.primary.colors.light.fill).toBe('primary')
    expect(reset.components.socialIcon.colors.light.fill).toBe('primary')
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
  it('uses the active theme_config palette for preview and public card', () => {
    const stock = getDefaultThemeConfig('v3')
    const themeConfig = {
      ...stock,
      colors: {
        ...stock.colors,
        light: { ...stock.colors.light, primary: '#112233', accent: '#abcdef' },
        dark: { ...stock.colors.dark, primary: '#00ff00', accent: '#0000ff' },
      },
    }

    const appearance = {
      profileTemplate: 'v3' as const,
      buttonStyle: 'solid' as const,
      cornerStyle: 'round' as const,
      layoutStyle: 'classic' as const,
    }
    const light = resolveProfileDesign(
      designSettings,
      { primaryColor: '#00ff00', accentColor: '#0000ff', fontFamily: 'outfit' },
      appearance,
      { themeConfig, colorMode: 'light' }
    )
    const dark = resolveProfileDesign(
      designSettings,
      { primaryColor: '#00ff00', accentColor: '#0000ff', fontFamily: 'outfit' },
      appearance,
      { themeConfig, colorMode: 'dark' }
    )

    expect(light.primaryColor).toBe('#112233')
    expect(light.accentColor).toBe('#abcdef')
    expect(dark.primaryColor).toBe('#00ff00')
    expect(dark.accentColor).toBe('#0000ff')
    expect(light.fontFamily).toBe('outfit')
  })

  it('uses flat theme colors when theme_config is absent', () => {
    const design = resolveProfileDesign(
      designSettings,
      { primaryColor: '#00ff00', accentColor: '#0000ff', fontFamily: 'outfit' },
      { profileTemplate: 'v3', buttonStyle: 'solid', cornerStyle: 'round', layoutStyle: 'classic' }
    )

    expect(design.primaryColor).toBe('#00ff00')
    expect(design.accentColor).toBe('#0000ff')
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
