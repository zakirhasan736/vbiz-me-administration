import {
  isTypographyBlockActive,
  normalizeRichTextHtml,
  shouldDefaultToParagraph,
} from '@/lib/editor/normalizeRichTextHtml'
import { describe, expect, it } from 'vitest'

describe('normalizeRichTextHtml', () => {
  it('defaults empty content to a paragraph', () => {
    expect(normalizeRichTextHtml('')).toBe('<p></p>')
    expect(normalizeRichTextHtml('   ')).toBe('<p></p>')
  })

  it('wraps loose text and color spans so they render as a paragraph', () => {
    expect(normalizeRichTextHtml('Hello world')).toBe('<p>Hello world</p>')
    expect(normalizeRichTextHtml('<span style="color: #dc2626">Hi</span>')).toBe(
      '<p><span style="color: #dc2626">Hi</span></p>'
    )
  })

  it('leaves existing blocks alone', () => {
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
