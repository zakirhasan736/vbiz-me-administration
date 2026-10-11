import { SmsOptInForm } from '@/components/sms/SmsOptInForm'
import { SMS_MESSAGE_TYPES, SMS_PRIVACY_URL, SMS_TERMS_URL } from '@/lib/sms/smsConsentCopy'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'vBiz Me SMS opt-in',
  description: 'Opt in to vBiz Me account notification texts.',
  robots: { index: true, follow: true },
}

export default function SmsConsentPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-12 text-slate-800 dark:text-slate-100">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
        vBiz Me LLC
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Account notification texts</h1>
      <p className="mt-3 text-sm leading-relaxed">
        On a public vBiz Me card, tap Save Contact or 1-on-1. Each popup has a mobile phone number field. vBiz Me texts
        that number about {SMS_MESSAGE_TYPES}. Message frequency varies. Message and data rates may apply. Reply STOP to
        unsubscribe. Reply HELP for help.
      </p>
      <p className="mt-3 text-sm leading-relaxed">
        Example: “vBiz Me 1-on-1: A visitor requested a 1-on-1. Reply from your backoffice.” Consent is not required to
        buy or use vBiz Me.
      </p>
      <p className="mt-3 text-sm">
        <a href={SMS_PRIVACY_URL} className="underline" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        {' · '}
        <a href={SMS_TERMS_URL} className="underline" target="_blank" rel="noopener noreferrer">
          Terms & Conditions
        </a>
      </p>
      <SmsOptInForm />
    </main>
  )
}
