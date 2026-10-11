'use client'

import { SMS_PRIVACY_URL, SMS_TERMS_URL, SMS_VISITOR_CONSENT_TEXT } from '@/lib/sms/smsConsentCopy'
import { FormEvent, useState } from 'react'

export function SmsOptInForm() {
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Enter a mobile phone number.')
      setDone(false)
      return
    }
    if (!agreed) {
      setError('Check the box to agree to account notification texts.')
      setDone(false)
      return
    }
    setError(null)
    setDone(true)
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="sms-phone" className="block text-sm font-semibold text-slate-900 dark:text-white">
          Mobile phone number
        </label>
        <input
          id="sms-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)
            setDone(false)
          }}
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-teal-600 dark:border-white/15 dark:bg-[#0b1018] dark:text-white"
        />
      </div>

      <label className="flex items-start gap-3 text-sm leading-snug text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          name="sms-consent"
          checked={agreed}
          onChange={(event) => {
            setAgreed(event.target.checked)
            setDone(false)
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
        />
        <span>
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
      {done ? (
        <p className="text-sm font-medium text-teal-800 dark:text-teal-300">
          Opt-in received for {phone.trim()}. vBiz Me sends account notification texts to this mobile number. Reply STOP
          to unsubscribe.
        </p>
      ) : null}

      <button
        type="submit"
        className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
      >
        Agree and opt in
      </button>
    </form>
  )
}
