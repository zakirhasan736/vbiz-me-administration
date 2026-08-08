'use client'

import { cn } from '@/utils/cn'
import { ChevronDown, ChevronUp, Mail, Phone, Search, User } from 'lucide-react'
import { useMemo, useState } from 'react'

export type DashboardContact = {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  message?: string | null
  createdAt?: string
  profile?: { id?: string; name?: string | null; slug?: string | null } | null
}

type ContactSavesPanelProps = {
  contacts?: DashboardContact[]
  className?: string
}

function formatWhen(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function initials(name?: string | null) {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '?'
  )
}

export function ContactSavesPanel({ contacts = [], className }: ContactSavesPanelProps) {
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return contacts
    return contacts.filter((c) => {
      const name = (c.name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      const card = (c.profile?.name || '').toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q) || card.includes(q)
    })
  }, [contacts, query])

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="shrink-0 px-4 pb-3 sm:px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pr-3 pl-10 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-300 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
              <User className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No contact saves yet</p>
            <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">
              When guests save your contact from your public vCard, they will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((contact) => {
              const open = expandedId === contact.id
              return (
                <li
                  key={contact.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : contact.id)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left sm:px-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      {initials(contact.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {contact.name || 'Guest'}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-slate-400">
                        {formatWhen(contact.createdAt)}
                        {contact.profile?.name ? ` · ${contact.profile.name}` : ''}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                  {open && (
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3 dark:border-white/5">
                      {contact.email && (
                        <p className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {contact.phone}
                        </p>
                      )}
                      {contact.message && (
                        <p className="rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                          {contact.message}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
