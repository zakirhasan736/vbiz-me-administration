import {
  isThemeNeutralColor,
  isTypographyBlockActive,
  normalizeRichTextHtml,
  shouldDefaultToParagraph,
} from '@/lib/editor/normalizeRichTextHtml'
import { describe, expect, it } from 'vitest'

describe('isThemeNeutralColor', () => {
  it('treats black, white, and editor default slate as theme colors', () => {
    expect(isThemeNeutralColor('rgb(0, 0, 0)')).toBe(true)
    expect(isThemeNeutralColor('rgb(0,0,0)')).toBe(true)
    expect(isThemeNeutralColor('#000')).toBe(true)
    expect(isThemeNeutralColor('#000000')).toBe(true)
    expect(isThemeNeutralColor('black')).toBe(true)
    expect(isThemeNeutralColor('#0f172a')).toBe(true)
    expect(isThemeNeutralColor('rgb(15, 23, 42)')).toBe(true)
    expect(isThemeNeutralColor('#ffffff')).toBe(true)
    expect(isThemeNeutralColor('white')).toBe(true)
  })

  it('keeps explicit picker colors', () => {
    expect(isThemeNeutralColor('#dc2626')).toBe(false)
    expect(isThemeNeutralColor('rgb(220, 38, 38)')).toBe(false)
    expect(isThemeNeutralColor('#2563eb')).toBe(false)
  })
})

describe('normalizeRichTextHtml', () => {
  it('defaults empty content to a paragraph', () => {
    expect(normalizeRichTextHtml('')).toBe('<p></p>')
    expect(normalizeRichTextHtml('   ')).toBe('<p></p>')
  })

  it('wraps loose text as a paragraph and keeps picker color spans', () => {
    expect(normalizeRichTextHtml('Hello world')).toBe('<p>Hello world</p>')
    expect(normalizeRichTextHtml('<span style="color: #dc2626">Hi</span>')).toBe(
      '<p><span style="color: #dc2626">Hi</span></p>'
    )
  })

  it('strips extra black/white spans under headings and paragraphs', () => {
    expect(normalizeRichTextHtml('<h2><span style="color: rgb(0, 0, 0)">Title</span></h2>')).toBe('<h2>Title</h2>')
    expect(normalizeRichTextHtml('<p><span style="color: #000000">Body</span></p>')).toBe('<p>Body</p>')
    expect(normalizeRichTextHtml('<p><span style="color: rgb(0, 0, 0)">Answer</span></p>')).toBe('<p>Answer</p>')
  })

  it('leaves existing blocks alone when they have no theme-clobbering color', () => {
    expect(normalizeRichTextHtml('<h2>Title</h2>')).toBe('<h2>Title</h2>')
    expect(normalizeRichTextHtml('<p>Body</p>')).toBe('<p>Body</p>')
  })

  it('treats paragraph as a typography block', () => {
    expect(isTypographyBlockActive({ isActive: (name) => name === 'paragraph' })).toBe(true)
    expect(isTypographyBlockActive({ isActive: () => false })).toBe(false)
  })

  it('defaults to paragraph only for empty or loose text nodes', () => {
    const docEditor = {
      isActive: () => false,
      state: { selection: { $from: { parent: { type: { name: 'doc' } } } } },
    }
    expect(shouldDefaultToParagraph(docEditor)).toBe(true)
    expect(
      shouldDefaultToParagraph({
        isActive: (name) => name === 'image',
        state: { selection: { $from: { parent: { type: { name: 'image' } } } } },
      })
    ).toBe(false)
  })
})
