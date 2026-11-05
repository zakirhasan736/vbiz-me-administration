import {
  classicSwatchGrid,
  formatHsl,
  formatHsv,
  hexToHsv,
  hexToRgb,
  hslToRgb,
  hsvToHex,
  parseHexColor,
  parseRgbChannel,
  rgbToHex,
  rgbToHsl,
} from '@/lib/color/colorSpace'
import { placeColorPopover } from '@/lib/color/placeColorPopover'
import { describe, expect, it } from 'vitest'

const VIEWPORTS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920]

describe('color space', () => {
  it('round-trips primary colors through hex, rgb, hsl, and hsv', () => {
    for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#112233', '#eed677']) {
      const rgb = hexToRgb(hex)
      expect(rgb).not.toBeNull()
      expect(rgbToHex(rgb!)).toBe(hex)
      const hsv = hexToHsv(hex)
      expect(hsv).not.toBeNull()
      expect(hsvToHex(hsv!)).toBe(hex)
      expect(rgbToHex(hslToRgb(rgbToHsl(rgb!)))).toBe(hex)
      expect(formatHsl(rgbToHsl(rgb!))).toMatch(/^hsl\(\d+ \d+% \d+%\)$/)
      expect(formatHsv(hsv!)).toMatch(/^hsv\(\d+ \d+% \d+%\)$/)
    }
  })

  it('rejects incomplete hex and out-of-range rgb so they cannot be saved', () => {
    expect(parseHexColor('#ff')).toBeNull()
    expect(parseHexColor('#gg0000')).toBeNull()
    expect(parseHexColor('#abc')).toBe('#aabbcc')
    expect(parseHexColor('112233')).toBe('#112233')
    expect(parseRgbChannel('')).toBeNull()
    expect(parseRgbChannel('256')).toBeNull()
    expect(parseRgbChannel('-1')).toBeNull()
    expect(parseRgbChannel('12a')).toBeNull()
    expect(parseRgbChannel('255')).toBe(255)
    expect(parseRgbChannel('0')).toBe(0)
  })

  it('builds a shade grid with a selected-color match', () => {
    const grid = classicSwatchGrid()
    expect(grid).toHaveLength(60)
    expect(grid[0]).toBe('#ffffff')
    expect(grid[9]).toBe('#000000')
    expect(grid.every((hex) => parseHexColor(hex) === hex)).toBe(true)
  })
})

describe('placeColorPopover', () => {
  const anchor = { top: 100, left: 40, right: 68, bottom: 128, width: 28, height: 28 }

  it('keeps the panel inside each requested viewport', () => {
    for (const width of VIEWPORTS) {
      const height = width < 500 ? 700 : width < 900 ? 1024 : 900
      const box = placeColorPopover(anchor, { width, height })
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.left + box.width).toBeLessThanOrEqual(width)
      expect(box.width).toBeLessThanOrEqual(width)
      if (box.placement === 'sheet') {
        expect(width < 640 || height < 500).toBe(true)
      } else {
        expect(box.top).toBeGreaterThanOrEqual(0)
        expect(box.top + Math.min(box.maxHeight, height)).toBeLessThanOrEqual(height + 8)
      }
    }
  })

  it('opens upward when the trigger sits on the bottom edge', () => {
    const box = placeColorPopover(
      { top: 760, left: 20, right: 48, bottom: 788, width: 28, height: 28 },
      { width: 1280, height: 800 }
    )
    expect(box.placement).toBe('above')
    expect(box.top).toBeGreaterThanOrEqual(8)
  })

  it('clamps a trigger on the right edge', () => {
    const box = placeColorPopover(
      { top: 40, left: 1800, right: 1828, bottom: 68, width: 28, height: 28 },
      { width: 1920, height: 1080 }
    )
    expect(box.placement).toBe('below')
    expect(box.left + box.width).toBeLessThanOrEqual(1920 - 8)
  })

  it('uses a sheet in phone landscape', () => {
    const box = placeColorPopover(anchor, { width: 844, height: 390 })
    expect(box.placement).toBe('sheet')
    expect(box.width).toBe(844)
  })
})
