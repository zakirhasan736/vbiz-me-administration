import { describe, expect, it } from 'vitest'
import {
  canUseCorporateBackOffice,
  directoryPathForOwnerMode,
  homePathForOwnerMode,
  ownerOfficeRedirectPath,
  resolveOwnerMode,
  resolveSessionOwnerMode,
  roleForOwnerMode,
} from './packageOwnerMode'

describe('package owner-mode resolution', () => {
  it('maps Free / Professional / Concierge to Single and Corporate to Corporate', () => {
    expect(resolveOwnerMode({ slug: 'free' })).toBe('single')
    expect(resolveOwnerMode({ slug: 'professional' })).toBe('single')
    expect(resolveOwnerMode({ slug: 'professional-concierge' })).toBe('single')
    expect(resolveOwnerMode({ slug: 'corporate' })).toBe('corporate')
    expect(resolveOwnerMode({ ownerMode: 'corporate', slug: 'free' })).toBe('corporate')
    expect(resolveOwnerMode({ ownerMode: 'SINGLE', slug: 'corporate' })).toBe('single')
    expect(roleForOwnerMode('single')).toBe('vcard-owner')
    expect(roleForOwnerMode('corporate')).toBe('corporate-owner')
  })

  it('resolves back-office mode from entitlements, not JWT role', () => {
    expect(
      resolveSessionOwnerMode({
        role: 'corporate-owner',
        entitlementsOwnerMode: 'single',
        profileOwnerMode: 'corporate',
      })
    ).toBe('single')
    expect(
      resolveSessionOwnerMode({
        role: 'vcard-owner',
        entitlementsOwnerMode: 'corporate',
      })
    ).toBe('corporate')
    expect(resolveSessionOwnerMode({ role: 'admin', entitlementsOwnerMode: 'corporate' })).toBeNull()
    expect(resolveSessionOwnerMode({ role: 'vcard-owner', profileOwnerMode: 'corporate' })).toBe('corporate')
    expect(resolveSessionOwnerMode({ role: 'corporate-owner' })).toBeNull()
  })

  it('keeps Single packages off Corporate back office paths', () => {
    expect(canUseCorporateBackOffice('single')).toBe(false)
    expect(homePathForOwnerMode('single')).toBe('/')
    expect(directoryPathForOwnerMode('single')).toBe('/vcards')
    expect(canUseCorporateBackOffice('corporate')).toBe(true)
    expect(homePathForOwnerMode('corporate')).toBe('/teamvcard')
    expect(directoryPathForOwnerMode('corporate')).toBe('/teamvcard')
    expect(ownerOfficeRedirectPath({ pathname: '/teamvcard', ownerMode: 'single', role: 'vcard-owner' })).toBe('/')
    expect(ownerOfficeRedirectPath({ pathname: '/vcards', ownerMode: 'corporate', role: 'vcard-owner' })).toBe(
      '/teamvcard'
    )
    expect(ownerOfficeRedirectPath({ pathname: '/vcards/create/home', ownerMode: 'corporate' })).toBeNull()
    expect(ownerOfficeRedirectPath({ pathname: '/teamvcard', role: 'admin' })).toBe('/admin/dashboard')
  })
})
