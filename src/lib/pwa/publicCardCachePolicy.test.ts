import {
  isBackofficePath,
  isHashedNextStaticPath,
  isPublicCardDataPath,
  isPublicCardPagePath,
} from '@/lib/pwa/publicCardCachePolicy'
import { describe, expect, it } from 'vitest'

describe('public card cache policy', () => {
  it('treats installed card pages as public PWA routes', () => {
    expect(isPublicCardPagePath('/v/acme')).toBe(true)
    expect(isPublicCardPagePath('/v/acme/icon/192')).toBe(false)
    expect(isPublicCardPagePath('/dashboard')).toBe(false)
  })

  it('does not treat backoffice or private APIs as public card data', () => {
    expect(isBackofficePath('/vcards/edit')).toBe(true)
    expect(isBackofficePath('/api/v1/profiles/123')).toBe(true)
    expect(isBackofficePath('/api/v1/public/profiles/123')).toBe(false)
    expect(isBackofficePath('/v/acme')).toBe(false)
  })

  it('allows public card APIs and card RSC data to be cached for offline', () => {
    expect(isPublicCardDataPath('/api/v1/public/profiles/abc')).toBe(true)
    expect(isPublicCardDataPath('/_next/data/build/v/acme.json')).toBe(true)
    expect(isPublicCardDataPath('/_next/data/build/dashboard.json')).toBe(false)
    expect(isHashedNextStaticPath('/_next/static/chunks/app.js')).toBe(true)
  })
})
