'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import type { IQueryMutationErrorResponse, TSetPasswordFormValues } from '@/interfaces'
import { useUpdateProfileMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import {
  clearPasswordSetupSession,
  getPasswordSetupServerSnapshot,
  getPasswordSetupSnapshot,
  getProviderLabel,
  subscribePasswordSetupSnapshot,
} from '@/utils/passwordSetup'
import { createSetPasswordSchema } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

const initialValues: TSetPasswordFormValues = {
  password: '',
  confirmPassword: '',
}

const SetPasswordView = () => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const session = useSyncExternalStore(
    subscribePasswordSetupSnapshot,
    getPasswordSetupSnapshot,
    getPasswordSetupServerSnapshot
  )
  const [updateProfile] = useUpdateProfileMutation()
  const validationSchema = useMemo(() => createSetPasswordSchema(session?.email), [session?.email])

  useEffect(() => {
    if (session) return
    toast.error('Please try signing in with email again to set a password.')
    router.replace('/login')
  }, [session, router])

  const handleSubmit = async (values: TSetPasswordFormValues) => {
    if (!session) return

    const res = await updateProfile({
      passwordSetupToken: session.passwordSetupToken,
      password: values.password,
    })
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      if (error.status === 401 || error.data?.statusCode === 401) {
        clearPasswordSetupSession()
        toast.error('Your password setup link expired. Please try email login again.')
        router.replace('/login')
        return
      }
      toast.error(error.data?.message || 'Failed to set password')
      return
    }

    clearPasswordSetupSession()
    toast.success('Password set successfully')
    router.push('/')
  }

  if (!session) {
    return <div className="mb-6 h-40" aria-hidden />
  }

  const providerLabel = getProviderLabel(session.providers[0])
  const { email } = session

  return (
    <>
      <p className="relative z-10 mb-6 rounded-[14px] border border-slate-200 bg-slate-50 p-3 text-left text-[12px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
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
            <Form className="relative z-10 mb-6 space-y-4" noValidate>
              <div className="group flex flex-col space-y-1.5 text-left">
                <label
                  htmlFor="password"
                  className={cn(
                    'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                    passwordInvalid
                      ? 'text-red-500'
                      : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
                  )}
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className={cn(
                      'pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 transition-colors',
                      passwordInvalid
                        ? 'text-red-500'
                        : 'group-focus-within:text-primary-600 text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    aria-invalid={passwordInvalid}
                    className={cn(
                      'w-full rounded-[14px] border bg-slate-50 py-3.5 pr-11 pl-11 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white',
                      passwordInvalid
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                        : 'focus:border-primary-500 focus:ring-primary-500 border-slate-200 dark:border-white/10'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordRulesTags password={values.password} email={email} />
                {passwordInvalid && !values.password ? <FormErrorMessage message={errors.password!} /> : null}
              </div>

              <div className="group flex flex-col space-y-1.5 text-left">
                <label
                  htmlFor="confirmPassword"
                  className={cn(
                    'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                    confirmPasswordInvalid
                      ? 'text-red-500'
                      : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
                  )}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className={cn(
                      'pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 transition-colors',
                      confirmPasswordInvalid
                        ? 'text-red-500'
                        : 'group-focus-within:text-primary-600 text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    aria-invalid={confirmPasswordInvalid}
                    className={cn(
                      'w-full rounded-[14px] border bg-slate-50 py-3.5 pr-11 pl-11 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white',
                      confirmPasswordInvalid
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                        : 'focus:border-primary-500 focus:ring-primary-500 border-slate-200 dark:border-white/10'
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

              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 mt-2 w-full rounded-2xl py-4 text-[14px] font-semibold text-white shadow-sm transition-all active:scale-95"
              >
                Set Password
              </button>
            </Form>
          )
        }}
      </Formik>
    </>
  )
}

export default SetPasswordView
