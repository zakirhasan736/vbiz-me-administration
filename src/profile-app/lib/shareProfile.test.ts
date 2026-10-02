import { describe, expect, it } from 'vitest'
import { buildFacebookShareHref, toAbsoluteShareUrl } from './shareProfile'

describe('shareProfile helpers', () => {
  it('builds Facebook sharer with absolute u= and quote containing the card link', () => {
    const href = buildFacebookShareHref(
      'https://app.vbizme.com/vCard/michael-hemingway-1',
      "Check out Michael's digital business card profile here:"
    )
    const url = new URL(href)
    expect(url.origin + url.pathname).toBe('https://www.facebook.com/sharer/sharer.php')
    expect(url.searchParams.get('u')).toBe('https://app.vbizme.com/vCard/michael-hemingway-1')
    expect(url.searchParams.get('quote')).toContain('https://app.vbizme.com/vCard/michael-hemingway-1')
  })

  it('normalizes absolute share URLs and strips hash/query', () => {
    expect(toAbsoluteShareUrl('https://app.vbizme.com/vCard/demo?x=1#tab')).toBe('https://app.vbizme.com/vCard/demo')
  })
})
