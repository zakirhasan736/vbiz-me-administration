'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { USER_ROLE_LABELS, USER_ROLES } from '@/constants/userRole'
import type { IQueryMutationErrorResponse, TRegisterFormValues, TRegisterPayload } from '@/interfaces'
import { useRegisterMutation } from '@/redux/features/auth/auth.api'
import { cn } from '@/utils/cn'
import { storeEmailVerificationSession } from '@/utils/emailVerification'
import { handlePasswordSetupRequired, isPasswordSetupRequired } from '@/utils/passwordSetup'
import { passwordNotEqualToEmailField } from '@/utils/passwordValidation'
import { Form, Formik } from 'formik'
import { Briefcase, ChevronDown, Eye, EyeOff, Loader, Lock, Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import * as yup from 'yup'

const PUBLIC_REGISTER_ROLES = USER_ROLES.filter((role) => role !== 'admin')

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [register, { isLoading }] = useRegisterMutation()
  const router = useRouter()

  const handleSubmit = async (values: TRegisterFormValues) => {
    if (!values.role) return

    const payload: TRegisterPayload = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
    }

    const res = await register(payload)
    const error = res.error as IQueryMutationErrorResponse | undefined
    if (error) {
      if (isPasswordSetupRequired(error) && handlePasswordSetupRequired(error)) {
        toast.message(error.data.message)
        router.push('/set-password')
        return
      }
      toast.error(error.data.message)
      return
    }
    storeEmailVerificationSession(values.email)
    toast.success('Registration successful')
    router.push('/verify-email')
  }

  return (
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
                  nameInvalid ? 'text-red-500' : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
                )}
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  className={cn(
                    'pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 transition-colors',
                    nameInvalid
                      ? 'text-red-500'
                      : 'group-focus-within:text-primary-600 text-slate-400 dark:text-slate-500'
                  )}
                />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  aria-invalid={nameInvalid}
                  className={cn(
                    'w-full rounded-[14px] border bg-slate-50 py-3.5 pr-4 pl-11 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white',
                    nameInvalid
                      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                      : 'focus:border-primary-500 focus:ring-primary-500 border-slate-200 dark:border-white/10'
                  )}
                />
              </div>
              {nameInvalid ? <FormErrorMessage message={errors.name!} /> : null}
            </div>

            <div className="group flex flex-col space-y-1.5 text-left">
              <label
                htmlFor="email"
                className={cn(
                  'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                  emailInvalid ? 'text-red-500' : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
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
                htmlFor="role"
                className={cn(
                  'pl-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
                  roleInvalid ? 'text-red-500' : 'text-slate-500 group-focus-within:text-slate-500 dark:text-slate-400'
                )}
              >
                Account Type
              </label>
              <div className="relative">
                <Briefcase
                  className={cn(
                    'pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 transition-colors',
                    roleInvalid
                      ? 'text-red-500'
                      : 'group-focus-within:text-primary-600 text-slate-400 dark:text-slate-500'
                  )}
                />
                <select
                  id="role"
                  name="role"
                  value={values.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={roleInvalid}
                  className={cn(
                    'w-full appearance-none rounded-[14px] border bg-slate-50 py-3.5 pr-11 pl-11 text-[13px] font-medium shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800',
                    !values.role ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white',
                    roleInvalid
                      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
                      : 'focus:border-primary-500 focus:ring-primary-500 border-slate-200 dark:border-white/10'
                  )}
                >
                  <option value="" disabled>
                    Select account type
                  </option>
                  {PUBLIC_REGISTER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={cn(
                    'pointer-events-none absolute top-1/2 right-4 z-10 h-4 w-4 -translate-y-1/2 transition-colors',
                    roleInvalid
                      ? 'text-red-500'
                      : 'group-focus-within:text-primary-600 text-slate-400 dark:text-slate-500'
                  )}
                />
              </div>
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
              className="bg-primary-600 hover:bg-primary-700 mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-semibold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </Form>
        )
      }}
    </Formik>
  )
}

export default RegisterView
