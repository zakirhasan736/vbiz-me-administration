'use client'

import SocialLogin from '@/components/auth/SocialLogin'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const authCopy = {
  '/login': {
    title: 'Welcome back',
    subtitle: 'Please log in to continue building your vCards.',
  },
  '/register': {
    title: 'Create an Account',
    subtitle: 'Register to start building your vCards.',
  },
  '/set-password': {
    title: 'Set your password',
    subtitle: 'Create a password so you can also sign in with email.',
  },
  '/verify-email': {
    title: 'Verify your email',
    subtitle: 'Enter the 6-digit code we sent to your inbox.',
  },
  '/forgot-password': {
    title: 'Forgot password',
    subtitle: 'Enter your email and we will send you a reset link.',
  },
  '/reset-password': {
    title: 'Reset your password',
    subtitle: 'Choose a new password for your account.',
  },
} as const

const resolveAuthCopy = (pathname: string) => {
  if (pathname.startsWith('/reset-password')) {
    return authCopy['/reset-password']
  }
  return authCopy[pathname as keyof typeof authCopy] ?? authCopy['/login']
}

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const isLogin = pathname === '/login'
  const isSetPassword = pathname === '/set-password'
  const isVerifyEmail = pathname === '/verify-email'
  const isForgotPassword = pathname === '/forgot-password'
  const isResetPassword = pathname.startsWith('/reset-password')
  const hideSocial = isSetPassword || isVerifyEmail || isForgotPassword || isResetPassword
  const copy = resolveAuthCopy(pathname)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900 dark:bg-[#09090b] dark:text-white">
      <div className="relative w-full max-w-sm overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#070a13]">
        <div className="bg-primary-600/20 pointer-events-none absolute top-0 left-1/2 h-25 w-50 -translate-x-1/2 rounded-full blur-[50px]" />

        <div className="from-primary-600 to-primary-800 shadow-primary-500/20 relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br text-3xl font-bold text-white shadow-sm">
          v
        </div>

        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{copy.title}</h2>
        <p className="mb-6 text-[13px] font-medium text-slate-500 dark:text-slate-400">{copy.subtitle}</p>

        {children}

        {!hideSocial ? (
          <>
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase dark:bg-[#070a13] dark:text-slate-400">
                Or
              </span>
            </div>

            <SocialLogin />

            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-white/10">
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <Link
                  href={isLogin ? '/register' : '/login'}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors outline-none"
                >
                  {isLogin ? 'Register' : 'Log In'}
                </Link>
              </p>
            </div>
          </>
        ) : !isSetPassword ? (
          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-white/10">
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              {isVerifyEmail
                ? 'Already verified?'
                : isForgotPassword || isResetPassword
                  ? 'Remember your password?'
                  : 'Already have an account?'}{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors outline-none"
              >
                Log In
              </Link>
              {isForgotPassword ? (
                <>
                  {' · '}
                  <Link
                    href="/register"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors outline-none"
                  >
                    Create account
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AuthLayout
