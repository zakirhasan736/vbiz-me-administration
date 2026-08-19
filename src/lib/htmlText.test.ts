import { describe, expect, it } from 'vitest'

import { decodeHtmlText, stripHtml } from '@/lib/htmlText'

describe('htmlText', () => {
  it('decodes ampersands and double-encoded entities', () => {
    expect(decodeHtmlText('Visionary &amp; Builder')).toBe('Visionary & Builder')
    expect(stripHtml('&lt;p&gt;Company &amp;amp; product&lt;/p&gt;')).toBe('Company & product')
  })
})
