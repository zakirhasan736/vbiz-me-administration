import { afterEach, describe, expect, it } from 'vitest'
import { getGaMeasurementId, getGoogleSiteVerification, getSiteOrigin } from './siteOrigin'

describe('siteOrigin', () => {
  const prevApp = process.env.NEXT_PUBLIC_APP_URL
  const prevGsc = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  const prevGscAlt = process.env.GOOGLE_SITE_VERIFICATION
  const prevGa = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = prevApp
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = prevGsc
    process.env.GOOGLE_SITE_VERIFICATION = prevGscAlt
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = prevGa
  })

  it('uses NEXT_PUBLIC_APP_URL without trailing slash', () => {
    expect(getSiteOrigin('https://app.vbiz.me/')).toBe('https://app.vbiz.me')
  })

  it('falls back to vbiz.me when unset', () => {
    expect(getSiteOrigin(null)).toBe('https://vbiz.me')
    expect(getSiteOrigin('')).toBe('https://vbiz.me')
  })

  it('reads Search Console and GA env vars', () => {
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = 'gsc-token'
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
    expect(getGoogleSiteVerification()).toBe('gsc-token')
    expect(getGaMeasurementId()).toBe('G-TEST123')
  })
})
