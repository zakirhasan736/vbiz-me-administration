'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button, Input } from '@/components/ui'
import { useAppDispatch } from '@/hooks/redux'
import type { IQueryMutationErrorResponse, TSetPasswordFormValues } from '@/interfaces'
import { useUpdateProfileMutation } from '@/redux/features/auth/auth.api'
import { updateAuthState } from '@/redux/features/auth/user.slice'
import { cn } from '@/utils/cn'
import { getProviderLabel } from '@/utils/passwordSetup'
import { createSetPasswordSchema } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { useMemo } from 'react'
import { toast } from 'sonner'

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
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    invalid={passwordInvalid}
                  />
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
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    invalid={confirmPasswordInvalid}
                  />
                  {confirmPasswordInvalid ? <FormErrorMessage message={errors.confirmPassword!} /> : null}
                </div>
              </div>

              <div className="flex w-full justify-end pt-2">
                <Button
                  type="submit"
                  variant="dark"
                  loading={isLoading}
                  className="w-full px-6 font-bold shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] sm:w-auto"
                >
                  {isLoading ? 'Setting…' : 'Set Password'}
                </Button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}

export default SetPasswordForm
