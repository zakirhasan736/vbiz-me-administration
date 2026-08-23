import { describe, expect, it } from 'vitest'
import { PUBLIC_SIGNUP_ENABLED, PUBLIC_SIGNUP_FALLBACK_PATH, PUBLIC_SIGNUP_PATH } from './publicSignup'

describe('public signup', () => {
  it('keeps self-serve register hidden and sends visitors to login', () => {
    expect(PUBLIC_SIGNUP_ENABLED).toBe(false)
    expect(PUBLIC_SIGNUP_PATH).toBe('/register')
    expect(PUBLIC_SIGNUP_FALLBACK_PATH).toBe('/login')
  })
})
