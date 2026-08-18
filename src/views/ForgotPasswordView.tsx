'use client'

import ForgotPasswordSentModal from '@/components/auth/ForgotPasswordSentModal'
import PasswordSetupRequiredModal from '@/components/auth/PasswordSetupRequiredModal'
import TurnstileWidget, { isTurnstileConfigured } from '@/components/auth/TurnstileWidget'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button, Input } from '@/components/ui'
import type { TPasswordSetupRequiredData } from '@/interfaces'
import type { IQueryMutationErrorResponse } from '@/interfaces/queryMutationErrorResponse'
import { useForgotPasswordMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import { getPasswordSetupRequiredData, isPasswordSetupRequired } from '@/utils/passwordSetup'
import { Form, Formik } from 'formik'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import * as yup from 'yup'

const initialValues = {
  email: '',
}

const validationSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
})

const ForgotPasswordView = () => {
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [passwordSetup, setPasswordSetup] = useState<TPasswordSetupRequiredData | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const resetTurnstile = () => {
    setTurnstileToken(null)
    setTurnstileResetSignal((value) => value + 1)
  }

  const handleSubmit = async (values: typeof initialValues) => {
    if (isTurnstileConfigured && !turnstileToken) {
      toast.error('Please complete the security check')
      return
    }

    const email = values.email.trim()
    const res = await forgotPassword({
      email,
      ...(turnstileToken ? { turnstileToken } : {}),
    })
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      resetTurnstile()
      if (isPasswordSetupRequired(error)) {
        const data = getPasswordSetupRequiredData(error)
        if (data) {
          setPasswordSetup(data)
          toast.info(error.data.message)
          return
        }
      }
      toast.error(error.data?.message || 'Failed to send reset email')
      return
    }

    setSentEmail(email)
    resetTurnstile()
  }

  return (
    <>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ errors, touched, values, handleChange, handleBlur }) => {
          const emailInvalid = Boolean(errors.email && touched.email)

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

              <TurnstileWidget resetSignal={turnstileResetSignal} onToken={setTurnstileToken} />

              <Button type="submit" size="lg" loading={isLoading} className="mt-2 w-full py-4">
                {isLoading ? 'Sending…' : 'Send reset link'}
              </Button>
            </Form>
          )
        }}
      </Formik>

      <ForgotPasswordSentModal open={Boolean(sentEmail)} onClose={() => setSentEmail(null)} email={sentEmail ?? ''} />

      <PasswordSetupRequiredModal
        open={Boolean(passwordSetup)}
        onClose={() => setPasswordSetup(null)}
        email={passwordSetup?.email ?? ''}
        providers={passwordSetup?.providers ?? []}
      />
    </>
  )
}

export default ForgotPasswordView
