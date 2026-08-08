'use client'

import { cn } from '@/utils/cn'
import { MessageCircle, Search, StickyNote } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DashboardContact } from './ContactSavesPanel'

type LeadNotesPanelProps = {
  contacts?: DashboardContact[]
  notesCount?: number
  className?: string
}

function getNote(contact: DashboardContact) {
  return (contact.message || '').trim()
}

export function LeadNotesPanel({ contacts = [], notesCount = 0, className }: LeadNotesPanelProps) {
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({})

  const withNotes = useMemo(() => {
    return contacts.filter((c) => getNote(c).length > 0)
  }, [contacts])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return withNotes
    return withNotes.filter((c) => {
      const name = (c.name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const note = getNote(c).toLowerCase()
      return name.includes(q) || email.includes(q) || note.includes(q)
    })
  }, [withNotes, query])

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="shrink-0 px-4 pb-3 sm:px-5">
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <StickyNote className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200/90">
            {notesCount > 0
              ? `${notesCount} note${notesCount === 1 ? '' : 's'} in this period · UI workspace for replies`
              : 'Guest notes & private replies workspace (UI)'}
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pr-3 pl-10 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
              <MessageCircle className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No notes yet</p>
            <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">
              Visitor messages left with contact saves will show up here for follow-up.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((contact) => {
              const open = activeId === contact.id
              return (
                <li
                  key={contact.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(open ? null : contact.id)}
                    className="flex w-full items-start gap-3 px-3 py-3 text-left sm:px-4"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {contact.name || 'Guest'}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {getNote(contact)}
                      </p>
                    </div>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-slate-100 px-4 py-3 dark:border-white/5">
                      <div>
                        <label className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase">
                          Private note
                        </label>
                        <textarea
                          value={privateNotes[contact.id] || ''}
                          onChange={(e) => setPrivateNotes((prev) => ({ ...prev, [contact.id]: e.target.value }))}
                          rows={3}
                          placeholder="Add a private follow-up note…"
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        />
                      </div>
                      <button
                        type="button"
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black tracking-wider text-white uppercase transition-colors hover:bg-indigo-700"
                      >
                        Save note
                      </button>
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
