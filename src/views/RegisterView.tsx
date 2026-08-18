'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import PasswordSetupRequiredModal from '@/components/auth/PasswordSetupRequiredModal'
import TurnstileWidget, { isTurnstileConfigured } from '@/components/auth/TurnstileWidget'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button, Input, Select } from '@/components/ui'
import { USER_ROLE_LABELS, USER_ROLES } from '@/constants/userRole'
import type {
  IQueryMutationErrorResponse,
  TPasswordSetupRequiredData,
  TRegisterFormValues,
  TRegisterPayload,
} from '@/interfaces'
import { useRegisterMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import { storeEmailVerificationSession } from '@/utils/emailVerification'
import { getPasswordSetupRequiredData, isPasswordSetupRequired } from '@/utils/passwordSetup'
import { passwordNotEqualToEmailField } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { Briefcase, Lock, Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import * as yup from 'yup'

const PUBLIC_REGISTER_ROLES = USER_ROLES.filter((role) => role !== 'admin' && role !== 'super-admin')

const initialValues: TRegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
}

const validationSchema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: passwordNotEqualToEmailField,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup
    .string()
    .oneOf([...PUBLIC_REGISTER_ROLES], 'Please select a role')
    .required('Please select a role'),
})

const RegisterView = () => {
  const [passwordSetup, setPasswordSetup] = useState<TPasswordSetupRequiredData | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [register, { isLoading }] = useRegisterMutation()
  const router = useRouter()

  const resetTurnstile = () => {
    setTurnstileToken(null)
    setTurnstileResetSignal((value) => value + 1)
  }

  const handleSubmit = async (values: TRegisterFormValues) => {
    if (!values.role) return
    if (isTurnstileConfigured && !turnstileToken) {
      toast.error('Please complete the security check')
      return
    }

    const payload: TRegisterPayload = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
      ...(turnstileToken ? { turnstileToken } : {}),
    }

    const res = await register(payload)
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
      toast.error(error.data.message)
      return
    }
    storeEmailVerificationSession(values.email, res.data?.data)
    toast.success('Registration successful')
    router.push('/verify-email')
  }

  return (
    <>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ errors, touched, values, handleChange, handleBlur }) => {
          const nameInvalid = Boolean(errors.name && touched.name)
          const emailInvalid = Boolean(errors.email && touched.email)
          const roleInvalid = Boolean(errors.role && touched.role)
          const passwordInvalid = Boolean(errors.password && touched.password)
          const confirmPasswordInvalid = Boolean(errors.confirmPassword && touched.confirmPassword)

          return (
            <Form className="relative z-10 mb-6 space-y-4" noValidate>
              <div className="group flex flex-col space-y-1.5 text-left">
                <label
                  htmlFor="name"
                  className={cn(
                    'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                    nameInvalid
                      ? 'text-red-500'
                      : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
                  )}
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  invalid={nameInvalid}
                  leftIcon={User}
                />
                {nameInvalid ? <FormErrorMessage message={errors.name!} /> : null}
              </div>

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
                  htmlFor="role"
                  className={cn(
                    'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                    roleInvalid
                      ? 'text-red-500'
                      : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
                  )}
                >
                  Account Type
                </label>
                <Select
                  id="role"
                  name="role"
                  value={values.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  invalid={roleInvalid}
                  leftIcon={Briefcase}
                  className={!values.role ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}
                >
                  <option value="" disabled>
                    Select account type
                  </option>
                  {PUBLIC_REGISTER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
                {roleInvalid ? <FormErrorMessage message={errors.role!} /> : null}
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
                <PasswordRulesTags password={values.password} email={values.email} />
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

              <TurnstileWidget resetSignal={turnstileResetSignal} onToken={setTurnstileToken} />

              <Button type="submit" size="lg" loading={isLoading} className="mt-2 w-full py-4">
                {isLoading ? 'Registering...' : 'Register'}
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

export default RegisterView
