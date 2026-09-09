import { formatPersonalAddressLine, hasPersonalAddressParts, toGoogleMapsSearchUrl } from '@/lib/personalAddress'
import { describe, expect, it } from 'vitest'

describe('personalAddress', () => {
  it('joins street, city/state, and zip', () => {
    expect(
      formatPersonalAddressLine({
        address: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
      })
    ).toBe('123 Main St, Los Angeles, CA, 90001')
  })

  it('detects when any address part is present', () => {
    expect(hasPersonalAddressParts({ address: '', city: 'Austin', state: '', zipCode: '' })).toBe(true)
    expect(hasPersonalAddressParts({ address: '', city: '', state: '', zipCode: '' })).toBe(false)
  })

  it('builds an encoded Google Maps search URL', () => {
    expect(
      toGoogleMapsSearchUrl({
        address: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
      })
    ).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('123 Main St, Los Angeles, CA, 90001')}`
    )
  })

  it('returns null when there is no address query', () => {
    expect(toGoogleMapsSearchUrl({ address: '', city: '', state: '', zipCode: '' })).toBeNull()
  })
})
