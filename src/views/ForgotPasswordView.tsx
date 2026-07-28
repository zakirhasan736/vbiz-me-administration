'use client'

import ForgotPasswordSentModal from '@/components/auth/ForgotPasswordSentModal'
import PasswordSetupRequiredModal from '@/components/auth/PasswordSetupRequiredModal'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import type { TPasswordSetupRequiredData } from '@/interfaces'
import type { IQueryMutationErrorResponse } from '@/interfaces/queryMutationErrorResponse'
import { useForgotPasswordMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import { getPasswordSetupRequiredData, isPasswordSetupRequired } from '@/utils/passwordSetup'
import { Form, Formik } from 'formik'
import { Loader, Mail } from 'lucide-react'
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
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const handleSubmit = async (values: typeof initialValues) => {
    const email = values.email.trim()
    const res = await forgotPassword({ email })
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
      toast.error(error.data?.message || 'Failed to send reset email')
      return
    }

    setSentEmail(email)
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

              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-semibold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>
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
