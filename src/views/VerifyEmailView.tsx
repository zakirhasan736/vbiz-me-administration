'use client'

import OtpInput, { OTP_LENGTH } from '@/components/auth/OtpInput'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button } from '@/components/ui'
import type { IQueryMutationErrorResponse } from '@/interfaces'
import { useSendVerificationEmailMutation, useVerifyEmailMutation } from '@/redux/features/auth/auth.api'
import {
  clearEmailVerificationSession,
  getEmailVerificationServerSnapshot,
  getEmailVerificationSnapshot,
  readEmailVerificationCooldownEnd,
  storeEmailVerificationSession,
  subscribeEmailVerificationSnapshot,
} from '@/utils/emailVerification'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

function getInitialCooldownSeconds() {
  const cooldownEnd = readEmailVerificationCooldownEnd()
  if (!cooldownEnd) return 0

  return Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000))
}

const VerifyEmailView = () => {
  const router = useRouter()
  const email: string | null = useSyncExternalStore(
    subscribeEmailVerificationSnapshot,
    getEmailVerificationSnapshot,
    getEmailVerificationServerSnapshot
  )

  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(getInitialCooldownSeconds)

  const [sendVerificationEmail, { isLoading: isSending }] = useSendVerificationEmailMutation()
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation()

  const autoSubmitLockRef = useRef(false)
  const isLeavingRef = useRef(false)

  useEffect(() => {
    if (email || isLeavingRef.current) return
    toast.error('Please log in to continue. New accounts are created by an administrator.')
    router.replace('/login')
  }, [email, router])

  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const applyCooldown = (remainingSecond?: number, cooldownEnd?: number) => {
    if (typeof remainingSecond === 'number' && remainingSecond > 0) {
      setCooldownSeconds(remainingSecond)
      return
    }
    if (typeof cooldownEnd === 'number') {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000)
      setCooldownSeconds(Math.max(0, remaining))
    }
  }

  const sendCode = async (showSuccessToast = false) => {
    if (!email) return false

    const res = await sendVerificationEmail(email)
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      toast.error(error.data?.message || 'Failed to send verification email')
      return false
    }

    const cooldown = res.data?.data
    applyCooldown(cooldown?.remainingSecond, cooldown?.cooldownEnd)
    storeEmailVerificationSession(email, cooldown)

    if (showSuccessToast) {
      toast.success('Verification code sent')
    }

    return true
  }

  const handleVerify = async (code: string) => {
    if (!email || isVerifying) return

    const sanitized = code.replace(/\D/g, '')
    if (sanitized.length !== OTP_LENGTH) {
      setOtpError('Enter the 6-digit code')
      return
    }

    setOtpError(null)
    const res = await verifyEmail({ email, otp: Number(sanitized) })
    const error = res.error as IQueryMutationErrorResponse | undefined

    if (error) {
      autoSubmitLockRef.current = false
      setOtpError(error.data?.message || 'Invalid verification code')
      toast.error(error.data?.message || 'Verification failed')
      return
    }

    isLeavingRef.current = true
    clearEmailVerificationSession()
    router.replace('/login?verified=1')
  }

  const handleOtpChange = (next: string) => {
    setOtp(next)
    if (otpError) setOtpError(null)
    if (next.length < OTP_LENGTH) {
      autoSubmitLockRef.current = false
    }
  }

  const handleOtpComplete = (code: string) => {
    if (autoSubmitLockRef.current || isVerifying) return
    autoSubmitLockRef.current = true
    void handleVerify(code)
  }

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isSending || isVerifying) return
    setOtp('')
    setOtpError(null)
    autoSubmitLockRef.current = false
    await sendCode(true)
  }

  if (!email) {
    return <div className="mb-6 h-40" aria-hidden />
  }

  const isBusy = isSending || isVerifying

  return (
    <>
      <p className="relative z-10 mb-6 rounded-[14px] border border-slate-200 bg-slate-50 p-3 text-left text-[12px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
        We sent a 6-digit code to{' '}
        <span className="font-semibold break-all text-slate-900 dark:text-white">{email}</span>. Enter it below to
        verify your account.
      </p>

      <form
        className="relative z-10 mb-6 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void handleVerify(otp)
        }}
      >
        <div className="flex flex-col space-y-1.5 text-left">
          <label
            htmlFor="otp"
            className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
          >
            Verification Code
          </label>
          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            onComplete={handleOtpComplete}
            disabled={isBusy}
            invalid={Boolean(otpError)}
            autoFocus
          />
          {otpError ? <FormErrorMessage message={otpError} /> : null}
        </div>

        <Button
          type="submit"
          size="lg"
          loading={isVerifying}
          disabled={isBusy || otp.length !== OTP_LENGTH}
          className="mt-2 w-full py-4"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </Button>

        <div className="pt-1 text-center">
          {cooldownSeconds > 0 ? (
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Resend code in{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{cooldownSeconds}s</span>
            </p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleResend()}
              disabled={isBusy}
              loading={isSending}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 h-auto px-0 text-[12px] hover:bg-transparent"
            >
              {isSending ? 'Sending...' : 'Resend code'}
            </Button>
          )}
        </div>
      </form>
    </>
  )
}

export default VerifyEmailView
