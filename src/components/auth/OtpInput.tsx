'use client'

import { cn } from '@/utils/cn'
import { useEffect, useRef, type ClipboardEvent, type FocusEvent, type KeyboardEvent } from 'react'

const OTP_LENGTH = 6

type OtpInputProps = {
  value: string
  onChange: (otp: string) => void
  onComplete?: (otp: string) => void
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
}

const digitsOnly = (value: string) => value.replace(/\D/g, '')

const OtpInput = ({ value, onChange, onComplete, disabled, invalid, autoFocus }: OtpInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const completedRef = useRef(false)

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '')

  useEffect(() => {
    if (!autoFocus || disabled) return
    inputsRef.current[0]?.focus()
  }, [autoFocus, disabled])

  useEffect(() => {
    if (value.length === OTP_LENGTH) {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.(value)
      }
      return
    }
    completedRef.current = false
  }, [value, onComplete])

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index))
    inputsRef.current[clamped]?.focus()
    inputsRef.current[clamped]?.select()
  }

  const updateValue = (next: string) => {
    const sanitized = digitsOnly(next).slice(0, OTP_LENGTH)
    onChange(sanitized)
  }

  const handleChange = (index: number, raw: string) => {
    if (disabled) return

    const incoming = digitsOnly(raw)
    if (!incoming) {
      const next = digits.map((d, i) => (i === index ? '' : d)).join('')
      updateValue(next)
      return
    }

    // Multi-digit (mobile autofill / paste into a single field)
    if (incoming.length > 1) {
      const next = (value.slice(0, index) + incoming).slice(0, OTP_LENGTH)
      updateValue(next)
      focusIndex(Math.min(next.length, OTP_LENGTH - 1))
      return
    }

    const nextDigits = [...digits]
    nextDigits[index] = incoming
    const next = nextDigits.join('').slice(0, OTP_LENGTH)
    updateValue(next)

    if (index < OTP_LENGTH - 1) {
      focusIndex(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        const nextDigits = [...digits]
        nextDigits[index] = ''
        updateValue(nextDigits.join(''))
        return
      }
      if (index > 0) {
        const nextDigits = [...digits]
        nextDigits[index - 1] = ''
        updateValue(nextDigits.join(''))
        focusIndex(index - 1)
      }
      return
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusIndex(index - 1)
      return
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusIndex(index + 1)
      return
    }

    if (e.key === 'Delete') {
      e.preventDefault()
      const nextDigits = [...digits]
      nextDigits[index] = ''
      updateValue(nextDigits.join(''))
    }
  }

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const pasted = digitsOnly(e.clipboardData.getData('text'))
    if (!pasted) return

    const next = (value.slice(0, index) + pasted).slice(0, OTP_LENGTH)
    updateValue(next)
    focusIndex(Math.min(next.length, OTP_LENGTH - 1))
  }

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  return (
    <div className="flex items-center justify-between gap-2" role="group" aria-label="One-time password">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          id={index === 0 ? 'otp' : undefined}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-invalid={invalid}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={handleFocus}
          className={cn(
            'h-12 w-full max-w-11 rounded-[14px] border bg-slate-50 text-center text-lg font-semibold text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white',
            invalid
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10'
              : 'focus:border-primary-500 focus:ring-primary-500 border-slate-200 dark:border-white/10',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        />
      ))}
    </div>
  )
}

export default OtpInput
export { OTP_LENGTH }
