'use client'

import PasswordSetupRequiredModal from '@/components/auth/PasswordSetupRequiredModal'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { useAppDispatch } from '@/hooks/redux'
import type { TPasswordSetupRequiredData } from '@/interfaces'
import type { IQueryMutationErrorResponse } from '@/interfaces/queryMutationErrorResponse'
import { useLoginMutation } from '@/redux/features/auth/auth.api'
import { updateAuthState } from '@/redux/features/auth/user.slice'
import { cn } from '@/utils/cn'
import { handleEmailNotVerified, isEmailNotVerified } from '@/utils/emailVerification'
import { getPasswordSetupRequiredData, isPasswordSetupRequired } from '@/utils/passwordSetup'
import { Form, Formik } from 'formik'
import Cookies from 'js-cookie'
import { Eye, EyeOff, Loader, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as yup from 'yup'

const initialValues = {
  email: '',
  password: '',
}

const validationSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
})

const LoginView = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordSetup, setPasswordSetup] = useState<TPasswordSetupRequiredData | null>(null)
  const [login, { isLoading }] = useLoginMutation()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const verifiedToastShownRef = useRef(false)

  useEffect(() => {
    if (searchParams.get('verified') !== '1' || verifiedToastShownRef.current) return
    verifiedToastShownRef.current = true
    toast.success('Email verified successfully. Please log in to your account.', {
      id: 'email-verified',
    })
    router.replace('/login')
  }, [searchParams, router])

  const handleSubmit = async (values: typeof initialValues) => {
    const res = await login(values)
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      if (isPasswordSetupRequired(error)) {
        const data = getPasswordSetupRequiredData(error)
        if (data) {
          setPasswordSetup(data)
          toast.info(error.data.message)
          return
        }
      }
      if (isEmailNotVerified(error) && handleEmailNotVerified(error)) {
        toast.info(error.data.message)
        router.push('/verify-email')
        return
      }
      toast.error(error.data.message)
      return
    }

    const payload = res.data!.data

    dispatch(
      updateAuthState({
        user: payload.profile,
        token: payload.accessToken,
        isLoading: false,
      })
    )

    toast.success('Login successful')
    const redirectTo = Cookies.get('redirect_after_login') || '/'
    Cookies.remove('redirect_after_login')
    router.push(redirectTo)
  }

  return (
    <>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ errors, touched, values, handleChange, handleBlur }) => {
          const emailInvalid = Boolean(errors.email && touched.email)
          const passwordInvalid = Boolean(errors.password && touched.password)

          return (
            <Form className="relative z-10 mb-6 space-y-4" noValidate>
              <div className="group flex flex-col space-y-1.5 text-left">
                <label
                  htmlFor="email"
                  className={cn(
                    'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                    emailInvalid
                      ? 'text-red-500'
                      : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
                  )}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className={cn(
                      'pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 transition-colors',
                      emailInvalid
                        ? 'text-red-500'
                        : 'group-focus-within:text-primary-600 text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@email.com"
                    aria-invalid={emailInvalid}
                    className={cn(
                      'w-full rounded-[14px] border bg-slate-50 py-3.5 pr-4 pl-11 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white',
                      emailInvalid
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                        : 'focus:border-primary-500 focus:ring-primary-500 border-slate-200 dark:border-white/10'
                    )}
                  />
                </div>
                {emailInvalid ? <FormErrorMessage message={errors.email!} /> : null}
              </div>

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
                  Password
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
                {passwordInvalid ? <FormErrorMessage message={errors.password!} /> : null}
                <div className="flex justify-end pt-0.5">
                  <Link
                    href="/forgot-password"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-[12px] font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-semibold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
            </Form>
          )
        }}
      </Formik>

      <PasswordSetupRequiredModal
        open={Boolean(passwordSetup)}
        onClose={() => setPasswordSetup(null)}
        email={passwordSetup?.email ?? ''}
        providers={passwordSetup?.providers ?? []}
      />
    </>
  )
}

export default LoginView
