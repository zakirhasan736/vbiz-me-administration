'use client'

import { useVCard } from '@/lib/VCardContext'
import { DEFAULT_VCARD_MY_INFO } from '@/lib/vcardMyInfo'
import type { VCardMyInfo } from '@/types/vcard'
import { Contact, Mail, MessageCircle, Phone } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm'

export function TabMyInfo() {
  const { vCardData, updateData } = useVCard()
  const m: VCardMyInfo = {
    ...DEFAULT_VCARD_MY_INFO,
    ...(vCardData.myInfo || {}),
  }

  const patch = (partial: Partial<VCardMyInfo>) => updateData('myInfo', { ...m, ...partial })

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl space-y-6 pb-12 duration-500">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/15">
          <Contact className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">My Info</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Controls the Call / Text / Email action screen on the public card.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-slate-200/60 bg-slate-50/40 p-6 dark:border-white/5 dark:bg-white/2">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Headline</span>
          <input
            className={inputClasses}
            value={m.headline || ''}
            onChange={(e) => patch({ headline: e.target.value })}
            placeholder="Ready When You Are"
          />
        </label>

        {(
          [
            ['showCall', 'callLabel', 'Call button', 'Call Now', Phone],
            ['showText', 'textLabel', 'Text button', 'Shoot Me A Text', MessageCircle],
            ['showEmail', 'emailLabel', 'Email button', 'Email Me', Mail],
          ] as const
        ).map(([showKey, labelKey, title, placeholder, Icon]) => (
          <div
            key={showKey}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]"
          >
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                <Icon className="h-4 w-4 text-sky-500" /> {title}
              </span>
              <input
                type="checkbox"
                checked={m[showKey] !== false}
                onChange={(e) => patch({ [showKey]: e.target.checked })}
                className="h-4 w-4 accent-sky-600"
              />
            </label>
            <input
              className={inputClasses}
              value={m[labelKey] || ''}
              onChange={(e) => patch({ [labelKey]: e.target.value })}
              placeholder={placeholder}
            />
          </div>
        ))}

        <p className="text-[12px] font-semibold text-slate-400">
          Uses phone / WhatsApp / email from Personal info when visitors tap the buttons.
        </p>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-[12px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-400">
          <p>
            Call &amp; Text:{' '}
            <span className="text-slate-800 dark:text-white">
              {vCardData.personal.phone || 'Add a phone in Personal'}
            </span>
          </p>
          <p className="mt-1">
            Email:{' '}
            <span className="text-slate-800 dark:text-white">
              {vCardData.personal.email || 'Add an email in Personal'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
