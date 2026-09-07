'use client'

import { DEFAULT_VCARD_MY_INFO, resolveMyInfoContact } from '@/lib/vcardMyInfo'
import { toMailtoHref, toSmsHref, toTelHref } from '@/profile-app/lib/openExternalIntent'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3EmptyState, V3SectionShell } from '@/profile-app/sections'
import { Mail, MessageCircle, Phone, type LucideIcon } from 'lucide-react'

type ActionRow = {
  id: string
  href: string
  label: string
  Icon: LucideIcon
  external: boolean
}

export function MyInfoSection() {
  const { personal, myInfo, design, embedded } = useProfileDisplay()
  const info = myInfo ?? DEFAULT_VCARD_MY_INFO
  const { phone, email, smsNumber } = resolveMyInfoContact(personal, info)
  const accent = design?.primaryColor?.trim() || '#7c3aed'

  const callHref = info.showCall !== false ? toTelHref(phone) : null
  const textHref = info.showText !== false ? toSmsHref(smsNumber) : null
  const emailHref = info.showEmail !== false ? toMailtoHref(email) : null

  const actions: ActionRow[] = [
    callHref
      ? {
          id: 'call',
          href: callHref,
          label: info.callLabel || DEFAULT_VCARD_MY_INFO.callLabel,
          Icon: Phone,
          external: false,
        }
      : null,
    textHref
      ? {
          id: 'text',
          href: textHref,
          label: info.textLabel || DEFAULT_VCARD_MY_INFO.textLabel,
          Icon: MessageCircle,
          external: false,
        }
      : null,
    emailHref
      ? {
          id: 'email',
          href: emailHref,
          label: info.emailLabel || DEFAULT_VCARD_MY_INFO.emailLabel,
          Icon: Mail,
          external: false,
        }
      : null,
  ].filter((row): row is ActionRow => Boolean(row))

  if (!actions.length) {
    return (
      <V3EmptyState
        icon={Phone}
        title={info.headline || DEFAULT_VCARD_MY_INFO.headline}
        message="Add a personal phone or email, then turn on Call / Text / Email in the editor."
      />
    )
  }

  const words = (info.headline || DEFAULT_VCARD_MY_INFO.headline).trim().split(/\s+/)
  const accentWord = words.length > 1 ? words.pop() : ''
  const lead = words.join(' ')

  return (
    <V3SectionShell>
      <div className="flex flex-col gap-5 md:gap-6">
        <div
          className={`vbiz-hero-banner dark:border-gold/20 relative overflow-hidden rounded-4xl border border-zinc-800 shadow-xl ${
            embedded ? 'px-4 py-8' : 'px-6 py-10 sm:px-8 sm:py-12 md:rounded-[2.5rem] md:px-10 md:py-14'
          }`}
        >
          <div className="bg-gold/10 pointer-events-none absolute top-0 right-0 -mt-24 -mr-24 rounded-full p-32 blur-3xl" />
          <h2 className="relative z-10 max-w-xl font-serif text-3xl leading-tight font-medium tracking-tight text-white italic sm:text-4xl md:text-5xl">
            {accentWord ? (
              <>
                {lead}{' '}
                <span className="from-gold bg-linear-to-r to-yellow-500 bg-clip-text text-transparent not-italic">
                  {accentWord}
                </span>
              </>
            ) : (
              <span className="from-gold bg-linear-to-r to-yellow-500 bg-clip-text text-transparent not-italic">
                {lead}
              </span>
            )}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {actions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group flex items-center gap-4 rounded-full px-5 py-4 text-white shadow-lg transition-transform active:scale-[0.98] sm:px-6 sm:py-4.5"
              style={{
                background: `linear-gradient(90deg, ${accent} 0%, #f97316 100%)`,
              }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                <action.Icon size={22} strokeWidth={2.25} />
              </span>
              <span className="text-base font-black tracking-tight sm:text-lg">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </V3SectionShell>
  )
}
