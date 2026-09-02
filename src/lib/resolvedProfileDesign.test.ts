import { designToCssVars, resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import { applyEditorSettingsToThemeConfig } from '@/lib/theme/resolveCardTheme'
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
  it('writes live primary, secondary, and accent onto both color modes', () => {
    const next = applyEditorSettingsToThemeConfig(
      getDefaultThemeConfig('v3'),
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
