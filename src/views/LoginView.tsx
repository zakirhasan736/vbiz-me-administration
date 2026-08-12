'use client'

import PasswordSetupRequiredModal from '@/components/auth/PasswordSetupRequiredModal'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button, Input } from '@/components/ui'
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
import { Lock, Mail } from 'lucide-react'
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

type LoginMutationError = IQueryMutationErrorResponse & { error?: string }

const getLoginErrorMessage = (error: LoginMutationError | undefined) => {
  const apiMessage = error?.data?.message?.trim()
  if (apiMessage) return apiMessage

  const fetchMessage = error?.error?.trim()
  if (fetchMessage) return fetchMessage

  return 'Login failed. Please check your connection and try again.'
}

const LoginView = () => {
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
    const error = res.error as LoginMutationError | undefined

    if (error) {
      if (isPasswordSetupRequired(error)) {
        const data = getPasswordSetupRequiredData(error)
        if (data) {
          setPasswordSetup(data)
          toast.info(getLoginErrorMessage(error))
          return
        }
      }
      if (isEmailNotVerified(error) && handleEmailNotVerified(error)) {
        toast.info(getLoginErrorMessage(error))
        router.push('/verify-email')
        return
      }
      toast.error(getLoginErrorMessage(error))
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
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@email.com"
                  invalid={emailInvalid}
                  leftIcon={Mail}
                />
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  invalid={passwordInvalid}
                  leftIcon={Lock}
                />
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

              <Button type="submit" size="lg" loading={isLoading} className="mt-2 w-full py-4">
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
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
