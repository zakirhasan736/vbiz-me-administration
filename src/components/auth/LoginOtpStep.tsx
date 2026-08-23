'use client'

import OtpInput, { OTP_LENGTH } from '@/components/auth/OtpInput'
import FormErrorMessage from '@/components/shared/FormErrorMessage'
import { Button } from '@/components/ui'
import type { IQueryMutationErrorResponse } from '@/interfaces'
import type { IUser } from '@/interfaces/user.interface'
import { useResendLoginOtpMutation, useVerifyLoginOtpMutation } from '@/redux/features/auth/auth.api'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type LoginOtpStepProps = {
  email: string
  purpose?: string
  initialCooldownEnd?: number
  initialRemainingSecond?: number
  onBack: () => void
  onVerified: (payload: { profile: IUser; accessToken: string }) => void
}

function cooldownFrom(end?: number, remainingSecond?: number) {
  if (typeof remainingSecond === 'number' && remainingSecond > 0) return remainingSecond
  if (typeof end === 'number' && end > Date.now()) return Math.ceil((end - Date.now()) / 1000)
  return 0
}

export default function LoginOtpStep({
  email,
  purpose,
  initialCooldownEnd,
  initialRemainingSecond,
  onBack,
  onVerified,
}: LoginOtpStepProps) {
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(() => cooldownFrom(initialCooldownEnd, initialRemainingSecond))
  const [verifyLoginOtp, { isLoading: isVerifying }] = useVerifyLoginOtpMutation()
  const [resendLoginOtp, { isLoading: isSending }] = useResendLoginOtpMutation()
  const autoSubmitLockRef = useRef(false)

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const activating = purpose === 'ACTIVATE'
  const isBusy = isSending || isVerifying

  const handleVerify = async (code: string) => {
    const sanitized = code.replace(/\D/g, '')
    if (sanitized.length !== OTP_LENGTH) {
      setOtpError('Enter the 6-digit code')
      return
    }
    setOtpError(null)
    const res = await verifyLoginOtp({ email, otp: sanitized })
    const error = res.error as IQueryMutationErrorResponse | undefined
    if (error) {
      autoSubmitLockRef.current = false
      setOtpError(error.data?.message || 'Invalid verification code')
      toast.error(error.data?.message || 'Could not verify the code')
      return
    }
    onVerified(res.data!.data)
  }

  const handleOtpComplete = (code: string) => {
    if (autoSubmitLockRef.current || isVerifying) return
    autoSubmitLockRef.current = true
    void handleVerify(code)
  }

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isBusy) return
    setOtp('')
    setOtpError(null)
    autoSubmitLockRef.current = false
    const res = await resendLoginOtp({ email })
    const error = res.error as IQueryMutationErrorResponse | undefined
    if (error) {
      toast.error(error.data?.message || 'Could not resend the code')
      return
    }
    const cooldown = res.data?.data
    setCooldownSeconds(cooldownFrom(cooldown?.cooldownEnd, cooldown?.remainingSecond) || 60)
    toast.success('A new code was sent to your email')
  }

  return (
    <form
      className="relative z-10 mb-6 space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void handleVerify(otp)
      }}
    >
      <p className="rounded-[14px] border border-slate-200 bg-slate-50 p-3 text-left text-[12px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
        We sent a 6-digit code to{' '}
        <span className="font-semibold break-all text-slate-900 dark:text-white">{email}</span>.{' '}
        {activating ? 'Enter it to activate your account and sign in.' : 'Enter it to finish signing in.'}
      </p>

      <div className="flex flex-col space-y-1.5 text-left">
        <label
          htmlFor="otp"
          className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
        >
          Sign-in code
        </label>
        <OtpInput
          value={otp}
          onChange={(next) => {
            setOtp(next)
            if (otpError) setOtpError(null)
            if (next.length < OTP_LENGTH) autoSubmitLockRef.current = false
          }}
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
        {isVerifying ? 'Verifying...' : activating ? 'Activate and continue' : 'Continue'}
      </Button>

      <div className="flex flex-col items-center gap-2 pt-1">
        {cooldownSeconds > 0 ? (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Resend code in <span className="font-semibold text-slate-700 dark:text-slate-200">{cooldownSeconds}s</span>
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isVerifying}
          className="h-auto px-0 text-[12px] font-semibold text-slate-500 hover:bg-transparent hover:text-slate-700 dark:text-slate-400"
        >
          Use a different account
        </Button>
      </div>
    </form>
  )
}
