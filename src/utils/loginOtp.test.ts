import { LOGIN_OTP_REQUIRED } from '@/constants'
import { describe, expect, it } from 'vitest'
import { isLoginOtpRequired } from './loginOtp'

describe('login OTP required helper', () => {
  it('detects the backend LOGIN_OTP_REQUIRED challenge', () => {
    expect(
      isLoginOtpRequired({
        data: {
          message: 'Enter the code',
          errorMessages: [],
          statusCode: 403,
          success: false,
          code: LOGIN_OTP_REQUIRED,
          data: { email: 'owner@example.com' },
        },
      })
    ).toBe(true)
  })

  it('ignores other auth errors', () => {
    expect(
      isLoginOtpRequired({
        data: {
          message: 'Invalid login credentials',
          errorMessages: [],
          statusCode: 401,
          success: false,
        },
      })
    ).toBe(false)
  })
})
