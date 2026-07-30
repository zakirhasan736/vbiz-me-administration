'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button, Input } from '@/components/ui'
import type { IQueryMutationErrorResponse, TChangePasswordFormValues } from '@/interfaces'
import { useChangePasswordMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import { createChangePasswordSchema } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { useMemo } from 'react'
import { toast } from 'sonner'

const initialValues: TChangePasswordFormValues = {
  oldPassword: '',
  password: '',
  confirmPassword: '',
}

type ChangePasswordFormProps = {
  email: string | null
}

const ChangePasswordForm = ({ email }: ChangePasswordFormProps) => {
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
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={values.oldPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                autoComplete="current-password"
                invalid={oldPasswordInvalid}
              />
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
                {isLoading ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </Form>
        )
      }}
    </Formik>
  )
}

export default ChangePasswordForm
