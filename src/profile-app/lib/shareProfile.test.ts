import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildFacebookShareHref,
  buildFacebookShareText,
  buildShareCopy,
  shareToFacebook,
  toAbsoluteShareUrl,
} from './shareProfile'

describe('shareProfile helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

  it('opens Facebook sharer on iPhone instead of navigator.share (Messages sheet)', async () => {
    const assign = vi.fn()
    const share = vi.fn()
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5,
      share,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    vi.stubGlobal('window', {
      location: { assign, origin: 'https://app.vbizme.com', href: 'https://app.vbizme.com/vCard/demo' },
      open: vi.fn(),
    })

    const result = await shareToFacebook(
      'https://app.vbizme.com/vCard/demo',
      'Check out this digital business card',
      'Demo Card'
    )

    expect(result).toBe('opened')
    expect(share).not.toHaveBeenCalled()
    expect(assign).toHaveBeenCalledTimes(1)
    const href = String(assign.mock.calls[0]?.[0] || '')
    expect(href).toContain('https://m.facebook.com/sharer.php')
    expect(href).toContain(encodeURIComponent('https://app.vbizme.com/vCard/demo'))
  })
})
