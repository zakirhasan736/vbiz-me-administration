import {
  displayCtaChromeStyle,
  displayGeneralRootStyle,
  displayIconChromeStyle,
  displaySocialChromeStyle,
  isPagesHeaderVisible,
  mergeDisplayFieldConfigs,
  resolveFieldModeColors,
  setCategoryResetColors,
} from '@/lib/vcardDisplaySettings'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { describe, expect, it } from 'vitest'

describe('display chrome styles', () => {
  it('writes social fill/fg onto theme CSS variables so !important tokens follow the owner color', () => {
    const style = displaySocialChromeStyle(
      {
        visible: true,
        backgroundColor: '#112233',
        textColor: '#abcdef',
      },
      'light'
    ) as Record<string, string>

    expect(style['--vbiz-social-fill']).toBe('#112233')
    expect(style['--vbiz-social-fg']).toBe('#abcdef')
  })

  it('uses light/dark mode colors independently', () => {
    const config = {
      visible: true,
      light: { backgroundColor: '#ffffff', textColor: '#111111' },
      dark: { backgroundColor: '#0b0b0d', textColor: '#f5f5f5' },
    }

    const light = displayIconChromeStyle(config, 'light') as Record<string, string>
    const dark = displayIconChromeStyle(config, 'dark') as Record<string, string>

    expect(light['--vbiz-btn-secondary-fill']).toBe('#ffffff')
    expect(light['--vbiz-btn-secondary-fg']).toBe('#111111')
    expect(dark['--vbiz-btn-secondary-fill']).toBe('#0b0b0d')
    expect(dark['--vbiz-btn-secondary-fg']).toBe('#f5f5f5')
  })

  it('does not apply legacy flat colors in dark mode so theme tokens stay readable', () => {
    expect(
      resolveFieldModeColors(
        {
          visible: true,
          backgroundColor: '#ffffff',
          textColor: '#000000',
        },
        'dark'
      )
    ).toEqual({})
    expect(
      displaySocialChromeStyle({ visible: true, backgroundColor: '#ffffff', textColor: '#000000' }, 'dark')
    ).toBeUndefined()
  })

  it('leaves theme tokens alone when the owner has not set a color', () => {
    expect(displaySocialChromeStyle({ visible: true })).toBeUndefined()
    expect(displayIconChromeStyle({ visible: true })).toBeUndefined()
    expect(displayCtaChromeStyle({ visible: true })).toBeUndefined()
  })

  it('merges Share + Share Btn colors with the first non-empty value winning', () => {
    const merged = mergeDisplayFieldConfigs(
      { visible: true, textColor: '#111111' },
      { visible: true, backgroundColor: '#222222', textColor: '#333333' }
    )

    expect(merged.textColor).toBe('#111111')
    expect(merged.backgroundColor).toBe('#222222')
  })

  it('scopes General Settings Pages Header vars without replacing --vbiz-bg or applying retired home colors', () => {
    const settings: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'Home Page BG Color': { visible: true, backgroundColor: '#112233' },
        'Home Page Banner Color': { visible: true, backgroundColor: '#445566' },
        'Pages Header': { visible: true, textColor: '#778899', backgroundColor: '#aabbcc' },
      },
    }

    const style = displayGeneralRootStyle(settings, 'light') as Record<string, string>

    expect(style['--vbiz-home-bg']).toBeUndefined()
    expect(style['--vbiz-home-banner']).toBeUndefined()
    expect(style['--vbiz-page-header-fg']).toBe('#778899')
    expect(style['--vbiz-page-header-fill']).toBe('#aabbcc')
    expect(style.backgroundColor).toBeUndefined()
    expect(style['--vbiz-bg']).toBeUndefined()
  })

  it('ignores hidden Pages Header so dark/light tokens remain', () => {
    const settings: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'Home Page BG Color': { visible: true, backgroundColor: '#112233' },
        'Pages Header': { visible: false, textColor: '#778899' },
      },
    }

    expect(displayGeneralRootStyle(settings)).toBeUndefined()
    expect(isPagesHeaderVisible(settings)).toBe(false)
  })

  it('resets category colors back to theme defaults', () => {
    const settings: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        Share: {
          visible: true,
          light: { backgroundColor: '#112233', textColor: '#abcdef' },
          dark: { backgroundColor: '#000000', textColor: '#ffffff' },
        },
        CRM: { visible: true, backgroundColor: '#445566' },
      },
    }

    const next = setCategoryResetColors(settings, ['Share', 'CRM'])
    expect(next.fields.Share.light).toBeUndefined()
    expect(next.fields.Share.dark).toBeUndefined()
    expect(next.fields.CRM.backgroundColor).toBeUndefined()
    expect(next.fields.Share.visible).toBe(true)
  })
})
