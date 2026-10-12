import { SMS_VISITOR_CONSENT_TEXT } from '@/lib/sms/smsConsentCopy'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions | vBiz Me',
  description: 'Terms and Conditions for vBiz Me LLC, including SMS opt-in terms.',
  robots: { index: true, follow: true },
}

const TOC = [
  ['acceptance', 'Acceptance of These Terms'],
  ['services', 'Our Services'],
  ['accounts', 'Accounts, Roles, and Security'],
  ['content', 'Your vCard Content'],
  ['public-cards', 'Public vCards and Lead Handling'],
  ['ai', 'AI-Assisted Features'],
  ['integrations', 'Third-Party Integrations'],
  ['payments', 'Plans, Payments, and Subscriptions'],
  ['acceptable-use', 'Acceptable Use'],
  ['platform-rights', 'vBiz Me Platform Rights'],
  ['availability', 'Service Changes and Availability'],
  ['termination', 'Suspension and Termination'],
  ['liability', 'Disclaimers and Limitation of Liability'],
  ['governing-law', 'Governing Law and Updates'],
  ['sms-terms', 'SMS Terms'],
] as const

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
        Legal Agreement
      </p>
      <p className="mt-2 text-xs text-slate-500">Last updated October 12, 2026</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Terms and Conditions</h1>
      <p className="mt-3">
        These Terms are an agreement with vBiz Me LLC and explain how customers, teams, administrators, and visitors may
        use vBiz Me, public vCards, and the vCard Backoffice Administration platform.
      </p>
      <ul className="mt-4 space-y-2">
        <li>
          <span className="font-semibold">Applies to.</span> Landing pages, public vCards, dashboards, admin tools, AI
          features, support, and integrations.
        </li>
        <li>
          <span className="font-semibold">Account use.</span> You are responsible for authorized users, accurate profile
          content, and secure account access.
        </li>
        <li>
          <span className="font-semibold">Questions.</span> Contact vBiz Me LLC at info@vbizme.com for billing, account,
          or legal questions.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-slate-950 dark:text-white">On This Page</h2>
      <ol className="mt-3 list-decimal space-y-1 pl-5">
        {TOC.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className="underline">
              {label}
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-8">
        Need help? Contact vBiz Me LLC about account, billing, privacy, or legal questions. info@vbizme.com · +1 (860)
        770-9893
      </p>

      <h2 id="acceptance" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        1. Acceptance of These Terms
      </h2>
      <p className="mt-3">
        By visiting vbizme.com, using a vBiz Me public vCard, creating an account, accessing the vCard Backoffice
        Administration dashboard, or using any related feature, you agree to these Terms and our Privacy Policy.
      </p>
      <p className="mt-3">
        If you use the Services on behalf of a company, team, or other organization, you confirm that you have authority
        to bind that organization to these Terms.
      </p>

      <h2 id="services" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        2. Our Services
      </h2>
      <p className="mt-3">
        vBiz Me provides digital business card and backoffice tools that help professionals and organizations create,
        publish, share, manage, and measure interactive vCards.
      </p>
      <p className="mt-3">
        The Services may include profile pages, QR code sharing, media hosting, contact save and lead capture tools,
        meetings, analytics, support tickets, notifications, templates, AI-assisted card creation, and third-party
        integrations such as Canva and social login providers.
      </p>

      <h2 id="accounts" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        3. Accounts, Roles, and Security
      </h2>
      <p className="mt-3">
        You must provide accurate account information and keep it current. You are responsible for maintaining the
        confidentiality of your login credentials and for all activity that occurs under your account.
      </p>
      <p className="mt-3">
        Corporate owners, administrators, super administrators, staff members, and card owners must use their access
        only for legitimate business purposes and only within the permissions assigned to them.
      </p>
      <p className="mt-3">
        You must tell us promptly if you believe your account, password, OAuth login, or administrator access has been
        compromised.
      </p>

      <h2 id="content" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        4. Your vCard Content
      </h2>
      <p className="mt-3">
        You are responsible for the profile information, images, videos, services, portfolios, posts, reviews, menus,
        social links, contact details, documents, and other content you upload, import, publish, or ask us to create for
        you.
      </p>
      <p className="mt-3">
        You keep ownership of your content. You grant vBiz Me a worldwide, non-exclusive, royalty-free license to host,
        store, reproduce, adapt for display, transmit, publish, and use your content as needed to provide, secure,
        improve, and support the Services.
      </p>
      <p className="mt-3">
        You represent that you have all rights and permissions needed for the content you provide, including rights for
        names, images, likenesses, testimonials, logos, trademarks, audio, video, and third-party materials.
      </p>

      <h2 id="public-cards" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        5. Public vCards and Lead Handling
      </h2>
      <p className="mt-3">
        Published vCards may be visible to anyone with the public link, QR code, NFC tap, or shared profile route.
        Information that you place on a public vCard may be indexed, copied, or shared by visitors.
      </p>
      <p className="mt-3">
        When visitors save a contact, leave a message, submit lead details, click social links, request meetings, or
        interact with a vCard, that activity may be routed to the relevant card owner, corporate owner, or authorized
        administrator.
      </p>
      <p className="mt-3">
        If you collect or use visitor leads through vBiz Me, you are responsible for honoring applicable privacy,
        marketing, consent, recordkeeping, and communication laws that apply to your own business.
      </p>

      <h2 id="ai" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        6. AI-Assisted Features
      </h2>
      <p className="mt-3">
        The Services may offer AI-assisted tools that analyze user-provided text, websites, files, images, or business
        descriptions to draft vCard sections, content ideas, FAQs, services, portfolio entries, or other profile
        material.
      </p>
      <p className="mt-3">
        AI output may be incomplete, inaccurate, or unsuitable for your industry. You are responsible for reviewing and
        approving AI-generated content before publishing or relying on it.
      </p>
      <p className="mt-3">
        Do not submit confidential, regulated, or third-party information to AI features unless you have permission and
        are comfortable with that information being processed to provide the requested feature.
      </p>

      <h2 id="integrations" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        7. Third-Party Integrations
      </h2>
      <p className="mt-3">
        Some features connect to third-party services, including payment processors, Google or Facebook social login,
        Canva, analytics providers, email services, hosting providers, and communication tools.
      </p>
      <p className="mt-3">
        Your use of third-party services is also governed by their own terms, privacy policies, permissions, and account
        settings. vBiz Me is not responsible for third-party services that we do not control.
      </p>
      <p className="mt-3">
        If you connect Canva or another integration, you authorize us to exchange data with that service as needed to
        provide the requested integration, such as listing designs, importing exported media, or confirming connection
        status.
      </p>

      <h2 id="payments" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        8. Plans, Payments, and Subscriptions
      </h2>
      <p className="mt-3">
        Paid plans, setup fees, recurring charges, trials, renewals, taxes, limits, and included features are described
        on the pricing page, checkout flow, invoice, order form, or written agreement that applies to your account.
      </p>
      <p className="mt-3">
        Payments may be processed by third-party payment providers. You authorize vBiz Me and its payment providers to
        charge the payment method associated with your account for applicable fees.
      </p>
      <p className="mt-3">
        Unless a separate written agreement says otherwise, fees are non-refundable except where required by law or
        expressly stated in the applicable checkout or order terms.
      </p>

      <h2 id="acceptable-use" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        9. Acceptable Use
      </h2>
      <p className="mt-3">You agree not to use the Services to:</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>
          Violate any law, regulation, contract, privacy right, publicity right, intellectual property right, or
          platform rule.
        </li>
        <li>Publish false, misleading, deceptive, defamatory, hateful, harassing, explicit, or harmful content.</li>
        <li>
          Upload malware, attempt unauthorized access, interfere with service operations, scrape data at scale, or
          bypass security controls.
        </li>
        <li>
          Send spam, unsolicited marketing, phishing messages, or communications that do not follow applicable consent
          requirements.
        </li>
        <li>
          Impersonate another person or organization, misrepresent qualifications, or publish content you are not
          authorized to use.
        </li>
      </ul>

      <h2 id="platform-rights" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        10. vBiz Me Platform Rights
      </h2>
      <p className="mt-3">
        The Services, software, dashboard interfaces, templates, designs, logos, code, workflows, documentation, and
        platform branding are owned by vBiz Me or its licensors.
      </p>
      <p className="mt-3">
        These Terms do not transfer ownership of the platform to you. You may use the Services only as allowed by these
        Terms, your plan, and any written agreement with vBiz Me.
      </p>

      <h2 id="availability" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        11. Service Changes and Availability
      </h2>
      <p className="mt-3">
        We may update, improve, suspend, restrict, or discontinue features from time to time. We aim to keep the
        Services reliable, but we do not guarantee uninterrupted access or error-free operation.
      </p>
      <p className="mt-3">
        Certain features may depend on internet access, browser support, mobile device capabilities, third-party
        providers, hosting services, payment processors, or connected accounts.
      </p>

      <h2 id="termination" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        12. Suspension and Termination
      </h2>
      <p className="mt-3">
        We may suspend or terminate access if we believe an account violates these Terms, creates security or legal
        risk, abuses the Services, fails to pay required fees, or harms vBiz Me, users, visitors, or third parties.
      </p>
      <p className="mt-3">
        You may stop using the Services at any time. Some data may be retained as described in the Privacy Policy or as
        required for legal, billing, security, backup, fraud prevention, or legitimate business purposes.
      </p>

      <h2 id="liability" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        13. Disclaimers and Limitation of Liability
      </h2>
      <p className="mt-3">
        The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the fullest extent
        permitted by law, vBiz Me disclaims warranties of merchantability, fitness for a particular purpose,
        non-infringement, accuracy, and uninterrupted availability.
      </p>
      <p className="mt-3">
        To the fullest extent permitted by law, vBiz Me will not be liable for indirect, incidental, special,
        consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost business opportunities,
        lost data, or reputational harm.
      </p>

      <h2 id="governing-law" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        14. Governing Law and Updates
      </h2>
      <p className="mt-3">
        These Terms are governed by the laws of the United States and, where applicable, the State of Connecticut,
        without regard to conflict-of-law rules, unless another written agreement requires a different governing law.
      </p>
      <p className="mt-3">
        We may update these Terms when our Services, business, or legal obligations change. The &quot;Last updated&quot;
        date shows when the page was most recently revised. Continued use of the Services after an update means you
        accept the updated Terms.
      </p>

      <h2 id="sms-terms" className="mt-10 text-lg font-semibold text-slate-950 dark:text-white">
        15. SMS Terms
      </h2>
      <p className="mt-3">
        By opting in, you agree to receive account-related text messages from vBiz Me LLC at the mobile number you
        provide.
      </p>
      <p className="mt-3">
        You opt in on{' '}
        <a href="/sms-consent" className="underline">
          https://app.vbizme.com/sms-consent
        </a>{' '}
        by entering your mobile number and checking a box that is not pre-checked. The same unchecked checkbox appears
        on a public vBiz Me card when you open Save Contact or 1-on-1. No text is sent unless you check the box. Consent
        is not required to download the contact file, to send a 1-on-1 request, or to buy or use vBiz Me.
      </p>
      <p className="mt-3">The checkbox says: {SMS_VISITOR_CONSENT_TEXT}</p>
      <p className="mt-3">
        Messages may include account notifications, appointments, scheduling alerts, contact activity, profile activity,
        saved-contact notifications, a confirmation when you save a contact, 1-on-1 time options, schedule reminders,
        and other service-related communications. Message frequency varies. Message and data rates may apply.
      </p>
      <p className="mt-3">
        Reply STOP to unsubscribe at any time. Reply HELP for assistance. Consent to receive SMS messages is not a
        condition of purchasing any product or service.
      </p>
      <p className="mt-3">
        Mobile numbers and SMS opt-in data are not shared with third parties or affiliates for marketing or promotional
        purposes.
      </p>

      <p className="mt-10">
        Related legal page:{' '}
        <a href="/privacy-policy#sms" className="underline">
          Privacy Policy
        </a>
      </p>
    </main>
  )
}
