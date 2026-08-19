import { LOGIN_OTP_REQUIRED } from '@/constants'
import type { IQueryMutationErrorResponse } from '@/interfaces'

export type TLoginOtpChallenge = {
  email: string
  purpose?: string
  cooldownEnd?: number
  remainingSecond?: number
  expiresAt?: number
}

export function isLoginOtpRequired(
  error: IQueryMutationErrorResponse | undefined
): error is IQueryMutationErrorResponse {
  return error?.data?.code === LOGIN_OTP_REQUIRED && typeof error?.data?.data?.email === 'string'
}

export function getLoginOtpChallenge(error: IQueryMutationErrorResponse): TLoginOtpChallenge | null {
  const email = error.data.data?.email
  if (!email) return null
  return {
    email,
    purpose: typeof error.data.data?.purpose === 'string' ? error.data.data.purpose : undefined,
    cooldownEnd: typeof error.data.data?.cooldownEnd === 'number' ? error.data.data.cooldownEnd : undefined,
    remainingSecond: typeof error.data.data?.remainingSecond === 'number' ? error.data.data.remainingSecond : undefined,
    expiresAt: typeof error.data.data?.expiresAt === 'number' ? error.data.data.expiresAt : undefined,
  }
}
