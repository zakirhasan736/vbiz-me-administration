'use client'

import { getGlobalConnections } from '@/lib/globalConnection'
import { Globe2, Mail, Phone } from 'lucide-react'

/** Read-only shared directory — same for every card owner */
export function TabGlobalConnection() {
  const list = getGlobalConnections()

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl space-y-6 pb-12 duration-500">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/15">
          <Globe2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Global Connection</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Shared network directory shown on every public card. Same list for all owners.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={person.avatar}
              alt=""
              className="h-14 w-14 rounded-2xl border border-slate-100 object-cover dark:border-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-black text-slate-900 dark:text-white">{person.name}</p>
              <p className="truncate text-[12px] font-bold text-slate-500">
                {person.title} · {person.company}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {person.phone && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Phone className="h-3 w-3" /> {person.phone}
                  </span>
                )}
                {person.email && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Mail className="h-3 w-3" /> {person.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
