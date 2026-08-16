'use client'

import { useVCard } from '@/lib/VCardContext'
import { IdCard } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm'

export function TabProfile() {
  const { vCardData, updateData } = useVCard()
  const p = vCardData.personal || ({} as typeof vCardData.personal)

  const setPersonal = (field: string, value: string) => {
    updateData(`personal.${field}`, value)
  }

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl space-y-6 duration-500">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15">
          <IdCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Profile</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Public name, role, and bio used on your card. Complements Personal.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-slate-200/60 bg-slate-50/40 p-6 dark:border-white/5 dark:bg-white/2">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Full name</span>
          <input
            className={inputClasses}
            value={p.fullName || ''}
            onChange={(e) => setPersonal('fullName', e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Designation</span>
          <input
            className={inputClasses}
            value={p.designation || ''}
            onChange={(e) => setPersonal('designation', e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Profession</span>
          <input
            className={inputClasses}
            value={p.profession || ''}
            onChange={(e) => setPersonal('profession', e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}
