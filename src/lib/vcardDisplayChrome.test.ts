import {
  displayCtaChromeStyle,
  displayGeneralRootStyle,
  displayIconChromeStyle,
  displaySocialChromeStyle,
  isPagesHeaderVisible,
  mergeDisplayFieldConfigs,
} from '@/lib/vcardDisplaySettings'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { describe, expect, it } from 'vitest'

describe('display chrome styles', () => {
  it('writes social fill/fg onto theme CSS variables so !important tokens follow the owner color', () => {
    const style = displaySocialChromeStyle({
      visible: true,
      backgroundColor: '#112233',
      textColor: '#abcdef',
    }) as Record<string, string>

    expect(style['--vbiz-social-fill']).toBe('#112233')
    expect(style['--vbiz-social-fg']).toBe('#abcdef')
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

  it('scopes General Settings colors to home/banner/header vars without replacing --vbiz-bg', () => {
    const settings: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'Home Page BG Color': { visible: true, backgroundColor: '#112233' },
        'Home Page Banner Color': { visible: true, backgroundColor: '#445566' },
        'Pages Header': { visible: true, textColor: '#778899', backgroundColor: '#aabbcc' },
      },
    }

    const style = displayGeneralRootStyle(settings) as Record<string, string>

    expect(style['--vbiz-home-bg']).toBe('#112233')
    expect(style['--vbiz-home-banner']).toBe('#445566')
    expect(style['--vbiz-page-header-fg']).toBe('#778899')
    expect(style['--vbiz-page-header-fill']).toBe('#aabbcc')
    expect(style.backgroundColor).toBeUndefined()
    expect(style['--vbiz-bg']).toBeUndefined()
  })

  it('ignores hidden General Settings colors so dark/light tokens remain', () => {
    const settings: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'Home Page BG Color': { visible: false, backgroundColor: '#112233' },
        'Pages Header': { visible: false, textColor: '#778899' },
      },
    }

    expect(displayGeneralRootStyle(settings)).toBeUndefined()
    expect(isPagesHeaderVisible(settings)).toBe(false)
  })
})
