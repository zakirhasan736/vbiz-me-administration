import { describe, expect, it } from 'vitest'
import { PUBLIC_SIGNUP_ENABLED, PUBLIC_SIGNUP_FALLBACK_PATH, PUBLIC_SIGNUP_PATH } from './publicSignup'
import { homePathForSession, resolvePostLoginPath } from './sessionPolicy'

describe('required matrix: public signup and login routing', () => {
  it('Public Signup hidden', () => {
    expect(PUBLIC_SIGNUP_ENABLED).toBe(false)
    expect(PUBLIC_SIGNUP_PATH).toBe('/register')
    expect(PUBLIC_SIGNUP_FALLBACK_PATH).toBe('/login')
  })

  it('Free / Professional / Concierge route to Single back office; Corporate to Corporate', () => {
    expect(homePathForSession({ role: 'vcard-owner', ownerMode: 'single' })).toBe('/')
    expect(homePathForSession({ role: 'vcard-owner', ownerMode: 'corporate' })).toBe('/teamvcard')
    expect(resolvePostLoginPath({ role: 'vcard-owner', ownerMode: 'single' }, '/teamvcard')).toBe('/')
    expect(resolvePostLoginPath({ role: 'corporate-owner', ownerMode: 'corporate' }, '/vcards')).toBe('/teamvcard')
  })
})
