import type { TUserRole } from '@/constants/userRole'

export type TRegisterPayload = {
  name: string
  email: string
  password: string
  role: TUserRole
  turnstileToken?: string
}

export type TRegisterFormValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: TUserRole | ''
}

export type TLoginPayload = {
  email: string
  password: string
  turnstileToken?: string
}

export type TForgotPasswordPayload = {
  email: string
  turnstileToken?: string
}

export type TPasswordSetupRequiredData = {
  email: string
  providers: string[]
  hasPassword: boolean
}

export type TUpdateProfilePayload = {
  passwordSetupToken?: string
  password?: string
  currentPassword?: string
  name?: string
  avatar?: string
}

export type TSetPasswordFormValues = {
  password: string
  confirmPassword: string
}

export type TChangePasswordFormValues = {
  oldPassword: string
  password: string
  confirmPassword: string
}

export type TChangePasswordPayload = {
  oldPassword: string
  password: string
}

export type TVerifyEmailPayload = {
  email: string
  otp: number
}
