'use client'

import { SMS_PRIVACY_URL, SMS_TERMS_URL, SMS_VISITOR_CONSENT_TEXT } from '@/lib/sms/smsConsentCopy'

type SmsPhoneConsentProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SmsPhoneConsent({ checked, onChange, disabled }: SmsPhoneConsentProps) {
  return (
    <label className="flex items-start gap-2 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
      <input
        type="checkbox"
        name="sms-consent"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-teal-700"
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
  )
}

export function smsConsentRequired(phone: string, agreed: boolean) {
  return phone.replace(/\D/g, '').length > 0 && !agreed
}
