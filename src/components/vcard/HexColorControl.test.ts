import { extractCssColor } from '@/components/vcard/HexColorControl'
import { describe, expect, it } from 'vitest'

describe('extractCssColor', () => {
  it('accepts bare and hashed hex', () => {
    expect(extractCssColor('A5D49B')).toBe('#a5d49b')
    expect(extractCssColor('#A5D49B')).toBe('#a5d49b')
    expect(extractCssColor('  #ff0000  ')).toBe('#ff0000')
  })

  it('accepts short hex on paste', () => {
    expect(extractCssColor('#fff')).toBe('#ffffff')
    expect(extractCssColor('fff')).toBe('#ffffff')
  })

  it('pulls a hex out of longer clipboard text', () => {
    expect(extractCssColor('background: #112233;')).toBe('#112233')
    expect(extractCssColor('Color FF00AA from Figma')).toBe('#ff00aa')
  })

  it('accepts rgb / rgba paste', () => {
    expect(extractCssColor('rgb(255, 64, 255)')).toBe('#ff40ff')
    expect(extractCssColor('rgba(17, 34, 51, 1)')).toBe('#112233')
  })

  it('returns null for incomplete typing', () => {
    expect(extractCssColor('#ff')).toBeNull()
    expect(extractCssColor('a5d49')).toBeNull()
    expect(extractCssColor('not-a-color')).toBeNull()
  })
})
