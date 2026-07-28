import * as yup from 'yup'

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/

export const PASSWORD_NOT_SAME_AS_EMAIL = "Password can't be the same as email"

export type TPasswordRuleId = 'minLength' | 'uppercase' | 'number' | 'special'

export type TPasswordRule = {
  id: TPasswordRuleId
  label: string
  met: boolean
}

export const isPasswordSameAsEmail = (password: string, email?: string | null): boolean => {
  const trimmedEmail = email?.trim().toLowerCase() ?? ''
  if (!password || !trimmedEmail) return false
  return password.trim().toLowerCase() === trimmedEmail
}

export const getPasswordRules = (password: string): TPasswordRule[] => [
  { id: 'minLength', label: '8+ characters', met: password.length >= 8 },
  { id: 'uppercase', label: 'Uppercase', met: /[A-Z]/.test(password) },
  { id: 'number', label: 'Number', met: /[0-9]/.test(password) },
  { id: 'special', label: 'Special character', met: SPECIAL_CHAR_REGEX.test(password) },
]

export const strongPasswordSchema = yup
  .string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[0-9]/, 'Password must contain at least one number')
  .matches(SPECIAL_CHAR_REGEX, 'Password must contain at least one special character')

/** Password rules + must not equal a sibling `email` field (register). */
export const passwordNotEqualToEmailField = strongPasswordSchema.test(
  'not-equal-to-email',
  PASSWORD_NOT_SAME_AS_EMAIL,
  function (value) {
    const email = this.parent?.email
    if (!value || typeof email !== 'string') return true
    return value.trim().toLowerCase() !== email.trim().toLowerCase()
  }
)

/** Password rules + must not equal a known email (set-password). */
export const createPasswordSchemaForEmail = (email: string | null | undefined) =>
  strongPasswordSchema.test('not-equal-to-email', PASSWORD_NOT_SAME_AS_EMAIL, (value) => {
    if (!value || !email) return true
    return value.trim().toLowerCase() !== email.trim().toLowerCase()
  })

export const createSetPasswordSchema = (email: string | null | undefined) =>
  yup.object().shape({
    password: createPasswordSchemaForEmail(email),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
  })
