import { describe, expect, it } from 'vitest'
import {
  homePathForRole,
  homePathForSession,
  isAuthenticatedWorkspacePath,
  isJwtExpired,
  jwtExpiresAt,
  resolvePostLoginPath,
  shouldSilentlyRefreshSession,
} from './sessionPolicy'

function tokenWithExpiry(exp: number): string {
  const encode = (value: string) => btoa(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${encode('{}')}.${encode(JSON.stringify({ exp }))}.${encode('{}')}`
}

describe('session policy', () => {
  it('silently refreshes card-owner sessions but never staff sessions', () => {
    expect(shouldSilentlyRefreshSession('vcard-owner')).toBe(true)
    expect(shouldSilentlyRefreshSession('corporate-owner')).toBe(true)
    expect(shouldSilentlyRefreshSession('admin')).toBe(true)
    expect(shouldSilentlyRefreshSession('super-admin')).toBe(true)
  })

  it('routes each role to its correct signed-in area', () => {
    expect(homePathForRole('vcard-owner')).toBe('/')
    expect(homePathForRole('corporate-owner')).toBe('/teamvcard')
    expect(homePathForRole('admin')).toBe('/admin/dashboard')
    expect(homePathForRole('super-admin')).toBe('/admin/dashboard')
  })

  it('routes owners by package ownerMode even when the JWT role disagrees', () => {
    expect(homePathForSession({ role: 'corporate-owner', ownerMode: 'single' })).toBe('/')
    expect(homePathForSession({ role: 'vcard-owner', ownerMode: 'corporate' })).toBe('/teamvcard')
    expect(homePathForSession({ role: 'admin', ownerMode: 'corporate' })).toBe('/admin/dashboard')
  })

  it('rejects stale cross-role redirect destinations after login', () => {
    expect(resolvePostLoginPath('admin', '/')).toBe('/admin/dashboard')
    expect(resolvePostLoginPath('vcard-owner', '/admin/users')).toBe('/')
    expect(resolvePostLoginPath('corporate-owner', '/admin/dashboard')).toBe('/teamvcard')
    expect(resolvePostLoginPath('admin', '/admin/users')).toBe('/admin/users')
    expect(resolvePostLoginPath('admin', '/crm')).toBe('/crm')
    expect(resolvePostLoginPath({ role: 'corporate-owner', ownerMode: 'single' }, '/teamvcard')).toBe('/')
    expect(resolvePostLoginPath({ role: 'vcard-owner', ownerMode: 'corporate' }, '/vcards')).toBe('/teamvcard')
    expect(resolvePostLoginPath({ role: 'vcard-owner', ownerMode: 'corporate' }, '/vcards/create/home')).toBe(
      '/vcards/create/home'
    )
  })

  it('treats missing, malformed, and expired tokens as expired', () => {
    expect(isJwtExpired(null)).toBe(true)
    expect(isJwtExpired('not-a-jwt')).toBe(true)
    expect(isJwtExpired(tokenWithExpiry(100), 100_000)).toBe(true)
    expect(isJwtExpired(tokenWithExpiry(200), 100_000)).toBe(false)
    expect(jwtExpiresAt(tokenWithExpiry(200))).toBe(200_000)
  })

  it('marks only private dashboards and backoffice as session-managed paths', () => {
    expect(isAuthenticatedWorkspacePath('/')).toBe(true)
    expect(isAuthenticatedWorkspacePath('/admin/dashboard')).toBe(true)
    expect(isAuthenticatedWorkspacePath('/vcards')).toBe(true)
    expect(isAuthenticatedWorkspacePath('/vcards/edit/home')).toBe(true)
    expect(isAuthenticatedWorkspacePath('/teamvcard')).toBe(true)
    expect(isAuthenticatedWorkspacePath('/settings')).toBe(true)
    expect(isAuthenticatedWorkspacePath('/crm')).toBe(true)
    expect(isAuthenticatedWorkspacePath('/crm/leads')).toBe(true)

    expect(isAuthenticatedWorkspacePath('/v/acme')).toBe(false)
    expect(isAuthenticatedWorkspacePath('/v/acme/icon/192')).toBe(false)
    expect(isAuthenticatedWorkspacePath('/login')).toBe(false)
    expect(isAuthenticatedWorkspacePath('/login?reason=session-expired')).toBe(false)
    expect(isAuthenticatedWorkspacePath('/register')).toBe(false)
  })
})
