'use client'

import { SMS_PRIVACY_URL, SMS_TERMS_URL, SMS_VISITOR_CONSENT_TEXT } from '@/lib/sms/smsConsentCopy'
import { FormEvent, useState } from 'react'

type OptInResult = 'opted_in' | 'skipped'

/**
 * Standalone SMS opt-in used on /sms-consent for A2P 10DLC reviewers.
 * Consent must be voluntary: phone + checkbox are optional, and users can skip.
 */
export function SmsOptInForm() {
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OptInResult | null>(null)

  const resetFeedback = () => {
    setError(null)
    setResult(null)
  }

  const onOptIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('To opt in, enter a mobile phone number and check the consent box. Or choose Skip SMS below.')
      setResult(null)
      return
    }
    if (!agreed) {
      setError('Check the optional consent box to opt in to texts, or choose Skip SMS to continue without messaging.')
      setResult(null)
      return
    }
    setError(null)
    setResult('opted_in')
  }

  const onSkip = () => {
    setPhone('')
    setAgreed(false)
    setError(null)
    setResult('skipped')
  }

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={onOptIn} className="space-y-4" noValidate>
        <div>
          <label htmlFor="sms-phone" className="block text-sm font-semibold text-slate-900 dark:text-white">
            Mobile phone number <span className="font-medium text-slate-400">(optional)</span>
          </label>
          <input
            id="sms-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 555 000 0000"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              resetFeedback()
            }}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-teal-600 dark:border-white/15 dark:bg-[#0b1018] dark:text-white"
          />
          <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Not required to use vBiz Me. Only needed if you choose to receive account notification texts.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm leading-snug text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <input
            type="checkbox"
            name="sms-consent"
            checked={agreed}
            onChange={(event) => {
              setAgreed(event.target.checked)
              resetFeedback()
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
          />
          <span>
            <span className="mb-1 block text-[11px] font-black tracking-wider text-teal-700 uppercase dark:text-teal-300">
              Optional SMS consent
            </span>
            {SMS_VISITOR_CONSENT_TEXT}{' '}
            <a href={SMS_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline">
              Privacy Policy
            </a>
            {' · '}
            <a href={SMS_TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline">
              Terms & Conditions
            </a>
          </span>
        </label>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {result === 'opted_in' ? (
          <p className="text-sm font-medium text-teal-800 dark:text-teal-300">
            Opt-in received for {phone.trim()}. vBiz Me may send account notification texts to this mobile number. Reply
            STOP to unsubscribe. Reply HELP for help.
          </p>
        ) : null}
        {result === 'skipped' ? (
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            You skipped SMS. You can still use vBiz Me without receiving text messages. You can return here later if you
            want to opt in.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Opt in to SMS
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5"
          >
            Skip SMS — continue without texts
          </button>
        </div>
      </form>
    </div>
  )
}
