export const PASSWORD_SETUP_REQUIRED = 'PASSWORD_SETUP_REQUIRED' as const
export const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED' as const

export const PASSWORD_SETUP_STORAGE_KEYS = {
  token: 'passwordSetupToken',
  email: 'passwordSetupEmail',
  providers: 'passwordSetupProviders',
} as const

export const EMAIL_VERIFICATION_STORAGE_KEY = 'pendingVerifyEmail' as const

export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  GOOGLE: 'Google',
  FACEBOOK: 'Facebook',
  LOCAL: 'email',
}
