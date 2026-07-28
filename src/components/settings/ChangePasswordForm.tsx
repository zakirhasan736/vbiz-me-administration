'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import type { IQueryMutationErrorResponse, TChangePasswordFormValues } from '@/interfaces'
import { useChangePasswordMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import { createChangePasswordSchema } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { Eye, EyeOff, Loader } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const inputClasses =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3.5 pr-11 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'

const initialValues: TChangePasswordFormValues = {
  oldPassword: '',
  password: '',
  confirmPassword: '',
}

type ChangePasswordFormProps = {
  email: string | null
}

const ChangePasswordForm = ({ email }: ChangePasswordFormProps) => {
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const validationSchema = useMemo(() => createChangePasswordSchema(email), [email])

  const handleSubmit = async (values: TChangePasswordFormValues, { resetForm }: { resetForm: () => void }) => {
    const res = await changePassword({
      oldPassword: values.oldPassword,
      password: values.password,
    })
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      toast.error(error.data?.message || 'Failed to change password')
      return
    }

    toast.success('Password changed successfully')
    resetForm()
  }

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
      {({ errors, touched, values, handleChange, handleBlur }) => {
        const oldPasswordInvalid = Boolean(errors.oldPassword && touched.oldPassword)
        const passwordInvalid = Boolean(errors.password && touched.password)
        const confirmPasswordInvalid = Boolean(errors.confirmPassword && touched.confirmPassword)

        return (
          <Form className="space-y-6" noValidate>
            <div className="group space-y-2">
              <label
                htmlFor="oldPassword"
                className={cn(
                  'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                  oldPasswordInvalid
                    ? 'text-red-500'
                    : 'group-focus-within:text-primary-500 text-slate-500 dark:text-slate-400'
                )}
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                  value={values.oldPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={oldPasswordInvalid}
                  className={cn(
                    inputClasses,
                    oldPasswordInvalid &&
                      'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  aria-label={showOldPassword ? 'Hide current password' : 'Show current password'}
                  className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {oldPasswordInvalid ? <FormErrorMessage message={errors.oldPassword!} /> : null}
            </div>

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
                {isLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </Form>
        )
      }}
    </Formik>
  )
}

export default ChangePasswordForm
