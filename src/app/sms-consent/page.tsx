import { SMS_PRIVACY_URL, SMS_TERMS_URL, SMS_VISITOR_CONSENT_TEXT } from '@/lib/sms/smsConsentCopy'
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
        Enter your mobile number and check the box to agree to text messages from vBiz Me LLC. The box is not
        pre-checked. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe. Reply HELP
        for help. Consent is not required to buy or use vBiz Me.
      </p>
      <form className="mt-6 space-y-4" action="/sms-consent" method="get">
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
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-teal-600 dark:border-white/15 dark:bg-[#0b1018] dark:text-white"
          />
        </div>
        <label className="flex items-start gap-3 text-sm leading-snug text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            name="sms-consent"
            value="yes"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
          />
          <span>
            {SMS_VISITOR_CONSENT_TEXT}{' '}
            <a href={SMS_PRIVACY_URL} className="underline">
              Privacy Policy
            </a>
            {' · '}
            <a href={SMS_TERMS_URL} className="underline">
              Terms & Conditions
            </a>
          </span>
        </label>
        <button
          type="submit"
          className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Agree and opt in
        </button>
      </form>
      <h2 className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">Consent screenshots</h2>
      <p className="mt-2 text-sm leading-relaxed">
        The same unchecked consent checkbox appears on a public vBiz Me card when a visitor opens Save Contact or
        1-on-1.
      </p>
      <figure className="mt-4">
        <img
          src="/sms-opt-in/save-contact.png"
          alt="Save Contact screen with an unchecked SMS consent checkbox, phone field, Privacy Policy, and Terms."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10"
        />
      </figure>
      <figure className="mt-4">
        <img
          src="/sms-opt-in/one-on-one.png"
          alt="1-on-1 screen with an unchecked SMS consent checkbox, phone field, Privacy Policy, and Terms."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10"
        />
      </figure>
    </main>
  )
}
