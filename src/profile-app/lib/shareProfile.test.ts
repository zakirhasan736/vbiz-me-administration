import { describe, expect, it } from 'vitest'
import { buildFacebookShareHref, buildFacebookShareText, buildShareCopy, toAbsoluteShareUrl } from './shareProfile'

describe('shareProfile helpers', () => {
  it('uses SEO meta title and description for share copy', () => {
    expect(
      buildShareCopy({
        metaTitle: 'Acme Plumbing | 24/7 Service',
        metaDescription: 'Licensed plumbers in Miami. Call today.',
        fallbackName: 'John Doe',
      })
    ).toEqual({
      title: 'Acme Plumbing | 24/7 Service',
      text: 'Licensed plumbers in Miami. Call today.',
      message: 'Acme Plumbing | 24/7 Service\nLicensed plumbers in Miami. Call today.',
    })
  })

  it('falls back to profile name when SEO is empty', () => {
    expect(buildShareCopy({ fallbackName: 'Ada L.' })).toEqual({
      title: 'Ada L.',
      text: "Check out Ada L.'s digital business card profile here:",
      message: "Ada L.\nCheck out Ada L.'s digital business card profile here:",
    })
  })

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

  it('builds mobile Facebook sharer for iPhone-friendly link handoff', () => {
    const href = buildFacebookShareHref('https://app.vbizme.com/vCard/demo', 'Check this out', { mobile: true })
    const url = new URL(href)
    expect(url.origin + url.pathname).toBe('https://m.facebook.com/sharer.php')
    expect(url.searchParams.get('u')).toBe('https://app.vbizme.com/vCard/demo')
    expect(url.searchParams.get('quote')).toContain('https://app.vbizme.com/vCard/demo')
  })

  it('puts the absolute card URL inside iOS Facebook share text', () => {
    const text = buildFacebookShareText(
      'https://app.vbizme.com/vCard/luzmarie',
      "Check out LuzMarie's digital business card profile here:"
    )
    expect(text).toContain('https://app.vbizme.com/vCard/luzmarie')
    expect(text.endsWith(' ')).toBe(true)
  })

  it('normalizes absolute share URLs and strips hash/query', () => {
    expect(toAbsoluteShareUrl('https://app.vbizme.com/vCard/demo?x=1#tab')).toBe('https://app.vbizme.com/vCard/demo')
  })
})
