import { formatPersonalAddressLine, hasPersonalAddressParts } from '@/lib/personalAddress'
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
})
