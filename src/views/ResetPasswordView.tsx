'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button, Input, Loader } from '@/components/ui'
import type { IQueryMutationErrorResponse, TSetPasswordFormValues } from '@/interfaces'
import { useResetPasswordMutation, useVerifyForgotPasswordMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import { createSetPasswordSchema } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const initialValues: TSetPasswordFormValues = {
  password: '',
  confirmPassword: '',
}

type ResetPasswordViewProps = {
  token: string
}

const ResetPasswordView = ({ token: tokenProp }: ResetPasswordViewProps) => {
  const router = useRouter()
  const token = tokenProp?.trim() || ''

  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)

  const [verifyForgotPassword] = useVerifyForgotPasswordMutation()
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const validationSchema = useMemo(() => createSetPasswordSchema(verifiedEmail), [verifiedEmail])

  useEffect(() => {
    let cancelled = false

    const verify = async () => {
      if (!token) {
        toast.error('Invalid password reset link. Please request a new one.')
        router.replace('/forgot-password')
        return
      }

      setIsVerifying(true)
      const res = await verifyForgotPassword({ token })
      if (cancelled) return

      const error = res.error as IQueryMutationErrorResponse | undefined
      if (error || !res.data?.data) {
        toast.error(error?.data?.message || 'Your password reset link is invalid or expired.')
        router.replace('/forgot-password')
        return
      }

      setVerifiedEmail(res.data.data.email)
      setIsVerifying(false)
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [token, router, verifyForgotPassword])

  const handleSubmit = async (values: TSetPasswordFormValues) => {
    if (!token || !verifiedEmail) return

    const res = await resetPassword({
      token,
      password: values.password,
    })
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      const status = error.status === 401 || error.data?.statusCode === 401
      const message = error.data?.message || ''
      const isExpired = status || /expired|invalid session|invalid or expired/i.test(message)

      if (isExpired) {
        toast.error(message || 'Your password reset link expired. Please request a new one.')
        router.replace('/forgot-password')
        return
      }
      toast.error(message || 'Failed to reset password')
      return
    }

    toast.success('Password reset successfully. Please log in.')
    router.push('/login')
  }

  if (isVerifying || !verifiedEmail) {
    return (
      <div className="relative z-10 mb-6 flex h-40 items-center justify-center" aria-busy="true">
        <Loader iconClassName="text-primary-600 h-6 w-6" />
      </div>
    )
  }

  return (
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
              <PasswordRulesTags password={values.password} email={verifiedEmail} />
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
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                invalid={confirmPasswordInvalid}
                leftIcon={Lock}
              />
              {confirmPasswordInvalid ? <FormErrorMessage message={errors.confirmPassword!} /> : null}
            </div>

            <Button type="submit" size="lg" loading={isLoading} className="mt-2 w-full py-4">
              {isLoading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </Form>
        )
      }}
    </Formik>
  )
}

export default ResetPasswordView
