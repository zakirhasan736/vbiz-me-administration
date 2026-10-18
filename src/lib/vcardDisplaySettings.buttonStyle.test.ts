import { displayCtaChromeStyle, styleAwareChromePaint } from '@/lib/vcardDisplaySettings'
import { describe, expect, it } from 'vitest'

describe('styleAwareChromePaint', () => {
  it('keeps solid paints unchanged', () => {
    expect(styleAwareChromePaint('#eed677', '#0f2c4d', 'solid', 'light')).toEqual({
      fill: '#eed677',
      fg: '#0f2c4d',
    })
  })

  it('frosts glass fills and defaults label to white', () => {
    const next = styleAwareChromePaint('#eed677', undefined, 'glass', 'dark')
    expect(next.fill).toContain('color-mix')
    expect(next.fill).toContain('#eed677')
    expect(next.fg).toBe('#ffffff')
  })

  it('tints outline fills for light and dark', () => {
    const light = styleAwareChromePaint('#eed677', undefined, 'outline', 'light')
    const dark = styleAwareChromePaint('#eed677', undefined, 'outline', 'dark', '#0f2c4d')
    expect(light.fill).toContain('10%')
    expect(dark.fill).toContain('#0f2c4d')
    expect(light.fg).toBe('#ffffff')
  })
})

describe('displayCtaChromeStyle', () => {
  it('returns undefined when no owner color override so Template Settings style can apply', () => {
    expect(
      displayCtaChromeStyle(undefined, 'dark', { bg: '#eed677', text: '#0f2c4d' }, { buttonStyle: 'glass' })
    ).toBeUndefined()
  })

  it('applies the exact saved fill without injecting Template defaults or glass mix', () => {
    const style = displayCtaChromeStyle(
      {
        visible: true,
        light: { backgroundColor: '#112233' },
        dark: { backgroundColor: '#112233' },
      },
      'dark',
      { bg: '#eed677', text: '#0f2c4d' },
      { buttonStyle: 'glass' }
    ) as Record<string, string> | undefined
    expect(style?.['--vbiz-btn-primary-fill']).toBe('#112233')
    expect(style?.['--vbiz-btn-secondary-fill']).toBe('#112233')
    expect(style?.['--vbiz-control-fill']).toBeUndefined()
  })

  it('does not freeze BG to Template defaults when only text is overridden', () => {
    const style = displayCtaChromeStyle(
      {
        visible: true,
        dark: { textColor: '#ff40ff' },
      },
      'dark',
      { bg: '#eed677', text: '#0f2c4d' },
      { buttonStyle: 'solid' }
    ) as Record<string, string> | undefined
    expect(style?.['--vbiz-btn-secondary-fg']).toBe('#ff40ff')
    expect(style?.['--vbiz-btn-secondary-fill']).toBeUndefined()
  })
})
