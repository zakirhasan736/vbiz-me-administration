import { describe, expect, it } from 'vitest'

import { stripHtml } from './resolveCalendarItemUrl'

describe('stripHtml', () => {
  it('turns editor-generated rich text into a readable blog excerpt', () => {
    const description =
      '<ol><li>First <a href="/blog">blog</a> item</li><li>Announcement&nbsp;test</li></ol><p>Final text</p>'

    expect(stripHtml(description)).toBe('First blog item Announcement test Final text')
  })

  it('handles entity-encoded and double-encoded HTML', () => {
    expect(stripHtml('&lt;p&gt;Company &amp;amp; product&lt;/p&gt;')).toBe('Company & product')
  })

  it('decodes numeric entities and preserves ordinary comparison text', () => {
    expect(stripHtml('<p>Price &#36;10 &#x2014; 2 < 3</p>')).toBe('Price $10 \u2014 2 < 3')
  })

  it('removes hidden executable content instead of exposing it as text', () => {
    expect(stripHtml('<p>Visible</p><script>alert("xss")</script><style>.hidden{}</style>')).toBe('Visible')
  })
})
