'use client'

import { FacebookIcon, GoogleIcon } from '@/icons'
import { useFacebookLoginMutation, useGoogleLoginMutation } from '@/redux/features/auth/auth.api'
import { useState } from 'react'

const SocialLogin = () => {
  const [googleLogin] = useGoogleLoginMutation()
  const [facebookLogin] = useFacebookLoginMutation()
  const [pendingProvider, setPendingProvider] = useState<'google' | 'facebook' | null>(null)

  const isBusy = pendingProvider !== null

  const handleGoogleLogin = () => {
    setPendingProvider('google')
    void googleLogin()
  }

  const handleFacebookLogin = () => {
    setPendingProvider('facebook')
    void facebookLogin()
  }

  return (
    <div className="relative z-10 space-y-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isBusy}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
      >
        <GoogleIcon className="h-4 w-4" />
        {pendingProvider === 'google' ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <button
        type="button"
        onClick={handleFacebookLogin}
        disabled={isBusy}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
      >
        <FacebookIcon className="h-4 w-4" />
        {pendingProvider === 'facebook' ? 'Redirecting…' : 'Continue with Facebook'}
      </button>
    </div>
  )
}

export default SocialLogin
