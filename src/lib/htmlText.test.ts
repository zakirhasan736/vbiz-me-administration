import { describe, expect, it } from 'vitest'

import { decodeHtmlText, plainTextToRichHtml, stripHtml } from '@/lib/htmlText'

describe('htmlText', () => {
  it('decodes ampersands and double-encoded entities', () => {
    expect(decodeHtmlText('Visionary &amp; Builder')).toBe('Visionary & Builder')
    expect(stripHtml('&lt;p&gt;Company &amp;amp; product&lt;/p&gt;')).toBe('Company & product')
  })

  it('decodes numeric whitespace and common named typography entities', () => {
    expect(decodeHtmlText('Area&#x20;Manager &#8212; Sales&nbsp;&amp;&nbsp;Marketing')).toBe(
      'Area Manager — Sales & Marketing'
    )
    expect(decodeHtmlText('Trusted&trade;&nbsp;&mdash;&nbsp;ready&hellip;')).toBe('Trusted™ — ready…')
  })

  it('wraps pasted plain paragraphs for rich-text description fields', () => {
    expect(plainTextToRichHtml('First para.\n\nSecond para.')).toBe('<p>First para.</p><p>Second para.</p>')
    expect(plainTextToRichHtml('<p>Already html</p>')).toBe('<p>Already html</p>')
  })
})
