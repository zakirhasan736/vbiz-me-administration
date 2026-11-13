import { describe, expect, it } from 'vitest'

import { isBlockedPublicHost } from './fetchPublicResource'
import { parseGalleryLinkPreview } from './linkPreview'

const PIXIESET_HTML = `
<html><head>
<meta property="og:site_name" content="Imagined By Aloe LLC">
<meta content="Photo collection by Imagined By Aloe LLC" property="og:description">
<meta property="og:title" content="Diplomatic Cuisine: Jamaican Cuisine Meets Soul Food">
<meta property="og:image" content="https://images.pixieset.com/collections/diplomatic.jpg">
<title>Ignored title</title>
</head><body><img src="/pixel.gif" alt=""><img src="/photos/first.jpg" alt=""></body></html>
`

describe('parseGalleryLinkPreview', () => {
  it('reads the Open Graph image, title, description, and keeps the gallery URL', () => {
    const preview = parseGalleryLinkPreview(PIXIESET_HTML, 'https://imaginedbyaloellc.pixieset.com/diplomatic')
    expect(preview).toEqual({
      url: 'https://imaginedbyaloellc.pixieset.com/diplomatic',
      title: 'Diplomatic Cuisine: Jamaican Cuisine Meets Soul Food',
      description: 'Photo collection by Imagined By Aloe LLC',
      image: 'https://images.pixieset.com/collections/diplomatic.jpg',
      siteName: 'Imagined By Aloe LLC',
    })
  })

  it('uses the first real image when the page has no Open Graph image', () => {
    const html =
      '<html><head><title>Sunday brunch</title></head><body><img src="/favicon.svg"><img src="photos/hero.jpg"></body></html>'
    const preview = parseGalleryLinkPreview(html, 'https://gallery.example.com/brunch')
    expect(preview.title).toBe('Sunday brunch')
    expect(preview.image).toBe('https://gallery.example.com/photos/hero.jpg')
    expect(preview.siteName).toBe('gallery.example.com')
  })
})

describe('isBlockedPublicHost', () => {
  it('blocks local and private targets', () => {
    expect(isBlockedPublicHost('localhost')).toBe(true)
    expect(isBlockedPublicHost('127.0.0.1')).toBe(true)
    expect(isBlockedPublicHost('169.254.169.254')).toBe(true)
    expect(isBlockedPublicHost('10.0.0.5')).toBe(true)
    expect(isBlockedPublicHost('images.pixieset.com')).toBe(false)
  })
})
