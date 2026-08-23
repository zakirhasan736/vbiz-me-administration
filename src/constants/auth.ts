export const PASSWORD_SETUP_REQUIRED = 'PASSWORD_SETUP_REQUIRED' as const
export const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED' as const
export const LOGIN_OTP_REQUIRED = 'LOGIN_OTP_REQUIRED' as const

/** Matches backend PASSWORD_SETUP_EXPIRY_MINUTES default (15). */
export const PASSWORD_SETUP_RESEND_COOLDOWN_SECONDS = 15 * 60

export const EMAIL_VERIFICATION_STORAGE_KEY = 'pendingVerifyEmail' as const
export const EMAIL_VERIFICATION_COOLDOWN_KEY = 'pendingVerifyCooldownEnd' as const

export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  GOOGLE: 'Google',
  FACEBOOK: 'Facebook',
  LOCAL: 'email',
}
