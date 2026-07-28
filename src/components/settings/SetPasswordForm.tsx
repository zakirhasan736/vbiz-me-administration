'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { useAppDispatch } from '@/hooks/redux'
import type { IQueryMutationErrorResponse, TSetPasswordFormValues } from '@/interfaces'
import { useUpdateProfileMutation } from '@/redux/features/auth/auth.api'
import { updateAuthState } from '@/redux/features/auth/user.slice'
import { cn } from '@/utils/cn'
import { getProviderLabel } from '@/utils/passwordSetup'
import { createSetPasswordSchema } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { Eye, EyeOff, Loader } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const inputClasses =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3.5 pr-11 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'

const initialValues: TSetPasswordFormValues = {
  password: '',
  confirmPassword: '',
}

type SetPasswordFormProps = {
  email: string | null
  provider?: string | null
}

const SetPasswordForm = ({ email, provider }: SetPasswordFormProps) => {
  const dispatch = useAppDispatch()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const validationSchema = useMemo(() => createSetPasswordSchema(email), [email])
  const providerLabel = getProviderLabel(provider ?? undefined)

  const handleSubmit = async (values: TSetPasswordFormValues) => {
    const res = await updateProfile({ password: values.password })
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      toast.error(error.data?.message || 'Failed to set password')
      return
    }

    const payload = res.data?.data
    if (payload?.user) {
      dispatch(
        updateAuthState({
          user: payload.user,
          ...(payload.accessToken ? { token: payload.accessToken } : {}),
          isLoading: false,
        })
      )
    }

    toast.success('Password set successfully')
  }

  return (
    <div className="space-y-6">
      <p className="rounded-[14px] border border-slate-200 bg-white/60 p-3 text-[12px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-300">
        You previously signed in with{' '}
        <span className="font-semibold text-slate-900 dark:text-white">{providerLabel}</span>
        {email ? (
          <>
            {' '}
            (<span className="break-all">{email}</span>).
          </>
        ) : (
          '.'
        )}{' '}
        Create a password to use email login too.
      </p>

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ errors, touched, values, handleChange, handleBlur }) => {
          const passwordInvalid = Boolean(errors.password && touched.password)
          const confirmPasswordInvalid = Boolean(errors.confirmPassword && touched.confirmPassword)

          return (
            <Form className="space-y-6" noValidate>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="group space-y-2">
                  <label
                    htmlFor="password"
                    className={cn(
                      'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                      passwordInvalid
                        ? 'text-red-500'
                        : 'group-focus-within:text-primary-500 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={passwordInvalid}
                      className={cn(
                        inputClasses,
                        passwordInvalid &&
                          'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordRulesTags password={values.password} email={email} />
                  {passwordInvalid ? <FormErrorMessage message={errors.password!} /> : null}
                </div>

                <div className="group space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className={cn(
                      'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                      confirmPasswordInvalid
                        ? 'text-red-500'
                        : 'group-focus-within:text-primary-500 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={confirmPasswordInvalid}
                      className={cn(
                        inputClasses,
                        confirmPasswordInvalid &&
                          'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPasswordInvalid ? <FormErrorMessage message={errors.confirmPassword!} /> : null}
                </div>
              </div>

              <div className="flex w-full justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-6 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto dark:bg-white dark:text-slate-900"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Setting…' : 'Set Password'}
                </button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}

export default SetPasswordForm
