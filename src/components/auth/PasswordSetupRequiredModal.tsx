'use client'

import SocialLogin from '@/components/auth/SocialLogin'
import { Modal } from '@/components/ui/Modal'
import { PASSWORD_SETUP_RESEND_COOLDOWN_SECONDS } from '@/constants'
import type { IQueryMutationErrorResponse } from '@/interfaces'
import { useResendPasswordSetupMutation } from '@/redux/features/auth/auth.api'
import { getProviderLabel } from '@/utils/passwordSetup'
import { Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type PasswordSetupRequiredModalProps = {
  open: boolean
  onClose: () => void
  email: string
  providers: string[]
}

const PasswordSetupRequiredModal = ({ open, onClose, email, providers }: PasswordSetupRequiredModalProps) => {
  const sessionKey = open ? email : ''
  const [cooldownSession, setCooldownSession] = useState(sessionKey)
  const [cooldownSeconds, setCooldownSeconds] = useState(PASSWORD_SETUP_RESEND_COOLDOWN_SECONDS)
  const [resendPasswordSetup, { isLoading: isResending }] = useResendPasswordSetupMutation()
  const providerLabel = getProviderLabel(providers[0])

  // Reset cooldown when the modal opens for a (possibly new) email — adjust during render, not in an effect.
  if (sessionKey !== cooldownSession) {
    setCooldownSession(sessionKey)
    if (sessionKey) {
      setCooldownSeconds(PASSWORD_SETUP_RESEND_COOLDOWN_SECONDS)
    }
  }

  useEffect(() => {
    if (!open) return

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [open, sessionKey])

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending) return

    const res = await resendPasswordSetup({ email })
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      toast.error(error.data?.message || 'Failed to resend setup email')
      if (error.data?.statusCode === 400 || error.status === 400) {
        setCooldownSeconds(PASSWORD_SETUP_RESEND_COOLDOWN_SECONDS)
      }
      return
    }

    setCooldownSeconds(PASSWORD_SETUP_RESEND_COOLDOWN_SECONDS)
    toast.success('Setup link sent. Check your inbox.')
  }

  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    return `${minutes}:${String(remaining).padStart(2, '0')}`
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="password-setup-title" describedBy="password-setup-desc">
      <div className="p-6 text-left">
        <div className="bg-primary-600/10 text-primary-600 dark:text-primary-400 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
          <Mail className="h-5 w-5" />
        </div>

        <h3 id="password-setup-title" className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
          Check your email
        </h3>
        <p id="password-setup-desc" className="mb-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          This account was created with{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{providerLabel}</span>. We sent a link to{' '}
          <span className="font-semibold break-all text-slate-800 dark:text-slate-200">{email}</span> so you can set a
          password for email login. You can also continue with social login below.
        </p>

        <div className="mb-4">
          {cooldownSeconds > 0 ? (
            <p className="text-center text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Resend link in{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {formatCooldown(cooldownSeconds)}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 w-full text-center text-[13px] font-semibold transition-colors disabled:opacity-60"
            >
              {isResending ? 'Sending…' : 'Resend setup link'}
            </button>
          )}
        </div>

        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase dark:bg-[#0b0f19] dark:text-slate-400">
            Or
          </span>
        </div>

        <SocialLogin />

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl border border-slate-200 py-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default PasswordSetupRequiredModal
