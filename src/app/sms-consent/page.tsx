import { SmsOptInForm } from '@/components/sms/SmsOptInForm'
import { SMS_PRIVACY_URL, SMS_TERMS_URL } from '@/lib/sms/smsConsentCopy'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'vBiz Me SMS opt-in (optional)',
  description:
    'Optionally opt in to vBiz Me account notification texts. SMS consent is voluntary and not required to use vBiz Me.',
  robots: { index: true, follow: true },
}

export default function SmsConsentPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-12 text-slate-800 dark:text-slate-100">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
        vBiz Me LLC
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
        Account notification texts (optional)
      </h1>
      <p className="mt-3 text-sm leading-relaxed">
        SMS opt-in is entirely voluntary. You can use vBiz Me without providing a phone number and without agreeing to
        texts. If you want account notification messages, enter a mobile number, check the optional consent box (it is
        never pre-checked), and choose <strong>Opt in to SMS</strong>. To decline messaging, choose{' '}
        <strong>Skip SMS — continue without texts</strong>.
      </p>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <li>Phone number is optional — not required to buy or use vBiz Me.</li>
        <li>Consent checkbox is optional and not pre-checked.</li>
        <li>You may skip SMS and still use every other vBiz Me service.</li>
        <li>Message frequency varies. Message and data rates may apply.</li>
        <li>Reply STOP to unsubscribe. Reply HELP for help.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed">
        Full details:{' '}
        <a href={SMS_PRIVACY_URL} className="underline">
          Privacy Policy
        </a>
        {' · '}
        <a href={SMS_TERMS_URL} className="underline">
          Terms & Conditions
        </a>
        .
      </p>

      <SmsOptInForm />

      <h2 className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">In-product consent (also optional)</h2>
      <p className="mt-2 text-sm leading-relaxed">
        On a public vBiz Me card, Save Contact and 1-on-1 also show an unchecked SMS consent checkbox. Visitors can
        complete those flows without SMS by leaving the box unchecked (and may omit a phone number when the form allows
        it). Consent is never a required condition of using the card.
      </p>
      <figure className="mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- static compliance screenshot for A2P reviewers */}
        <img
          src="/sms-opt-in/save-contact.png"
          alt="Save Contact screen with an unchecked optional SMS consent checkbox, phone field, Privacy Policy, and Terms."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10"
        />
      </figure>
      <figure className="mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- static compliance screenshot for A2P reviewers */}
        <img
          src="/sms-opt-in/one-on-one.png"
          alt="1-on-1 screen with an unchecked optional SMS consent checkbox, phone field, Privacy Policy, and Terms."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10"
        />
      </figure>
    </main>
  )
}
