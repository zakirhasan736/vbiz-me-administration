import { describe, expect, it } from 'vitest'

import { displayImageSrc } from './displayImageSrc'

describe('displayImageSrc', () => {
  it('keeps uploaded and known image hosts as the original URL', () => {
    const unsplash = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&w=1200'
    expect(displayImageSrc(unsplash)).toBe(unsplash)
    expect(displayImageSrc('https://aws-s3-vbizme-vcard.s3.us-east-2.amazonaws.com/a.jpg')).toBe(
      'https://aws-s3-vbizme-vcard.s3.us-east-2.amazonaws.com/a.jpg'
    )
    expect(displayImageSrc('blob:http://localhost/123')).toBe('blob:http://localhost/123')
  })

  it('proxies a pasted image URL from any other host', () => {
    expect(displayImageSrc('https://cdn.example.com/photos/chef.jpg')).toBe(
      '/api/remote-image?url=https%3A%2F%2Fcdn.example.com%2Fphotos%2Fchef.jpg'
    )
  })
})
