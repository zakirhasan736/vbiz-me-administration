'use client'

import { SMS_PRIVACY_URL, SMS_TERMS_URL, SMS_VISITOR_CONSENT_TEXT } from '@/lib/sms/smsConsentCopy'
import { useId, useState } from 'react'

type SmsPhoneConsentProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SmsPhoneConsent({ checked, onChange, disabled }: SmsPhoneConsentProps) {
  const [expanded, setExpanded] = useState(false)
  const textId = useId()

  return (
    <div className="flex items-start gap-2 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
      <input
        type="checkbox"
        name="sms-consent"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-teal-700"
        aria-describedby={textId}
      />
      <div className="min-w-0 flex-1">
        <p id={textId} className={expanded ? undefined : 'line-clamp-2'}>
          {SMS_VISITOR_CONSENT_TEXT}{' '}
          <a href={SMS_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Privacy Policy
          </a>
          {' · '}
          <a href={SMS_TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Terms & Conditions
          </a>
        </p>
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-[11px] font-bold tracking-wide text-teal-700 uppercase underline-offset-2 hover:underline dark:text-teal-300"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      </div>
    </div>
  )
}

export function smsConsentRequired(phone: string, agreed: boolean) {
  return phone.replace(/\D/g, '').length > 0 && !agreed
}
