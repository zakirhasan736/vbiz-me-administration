'use client'

import type { CorporateLeadRecord } from '@/components/dashboard/corporate/CorporateContactSavesPanel'
import { notify } from '@/lib/toast/toast'
import { usePatchContactMutation } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { AlertTriangle, MessageCircle, Save, Search, StickyNote } from 'lucide-react'
import { useMemo, useState } from 'react'

type CorporateLeadNotesRepliesPanelProps = {
  contacts?: CorporateLeadRecord[]
  className?: string
}

function getGuestNote(lead: CorporateLeadRecord) {
  return (lead.message || '').trim()
}

export function CorporateLeadNotesRepliesPanel({ contacts = [], className }: CorporateLeadNotesRepliesPanelProps) {
  const [records, setRecords] = useState(contacts)
  const [prevContacts, setPrevContacts] = useState(contacts)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [replyMap, setReplyMap] = useState<Record<string, string>>({})
  const [patchContact, { isLoading: saving }] = usePatchContactMutation()

  if (contacts !== prevContacts) {
    setPrevContacts(contacts)
    setRecords(contacts)
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return records.filter((r) => {
      if (!q) return true
      const name = (r.name || '').toLowerCase()
      const email = (r.email || '').toLowerCase()
      const phone = (r.phone || '').toLowerCase()
      const guest = getGuestNote(r).toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q) || guest.includes(q)
    })
  }, [records, query])

  const pendingReplyCount = filtered.filter((r) => !r.lastReply).length

  const savePrivateNote = async (id: string, source?: CorporateLeadRecord['source']) => {
    const privateNotes = noteMap[id] ?? records.find((r) => r.id === id)?.privateNotes ?? ''
    try {
      const updated = await patchContact({ id, privateNotes, source }).unwrap()
      setRecords((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                privateNotes: updated.privateNotes ?? privateNotes,
                lastReply: updated.lastReply ?? item.lastReply,
              }
            : item
        )
      )
      notify.success('Private note saved.')
    } catch (e) {
      const message =
        (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not save note.'
      notify.error(message)
    }
  }

  const sendReply = async (id: string, source?: CorporateLeadRecord['source']) => {
    const text = (replyMap[id] || '').trim()
    if (!text) return
    try {
      const updated = await patchContact({ id, lastReply: text, source }).unwrap()
      setRecords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, lastReply: updated.lastReply ?? text } : item))
      )
      setReplyMap((p) => ({ ...p, [id]: '' }))
      setActiveId(null)
      notify.success('Reply saved.')
    } catch (e) {
      const message =
        (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not send reply.'
      notify.error(message)
    }
  }

  return (
    <div
      className={cn(
        'w-full max-w-full min-w-0 overflow-hidden rounded-[28px] border border-rose-200/70 bg-linear-to-br from-rose-50/80 via-white to-amber-50/40 shadow-sm dark:border-rose-500/25 dark:from-rose-500/10 dark:via-[#0b0f19] dark:to-amber-500/5',
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 border-b border-rose-100/80 px-4 py-4 sm:px-6 sm:py-5 dark:border-rose-500/15">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-500 px-2.5 py-1 text-[10px] font-black tracking-wider text-white uppercase">
              <AlertTriangle className="h-3.5 w-3.5" />
              Urgent
            </span>
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-black text-slate-900 sm:text-base dark:text-white">
              <MessageCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="wrap-break-word">Lead Notes & Replies</span>
            </h3>
          </div>
          <p className="text-xs font-semibold wrap-break-word text-slate-500 dark:text-slate-400">
            Guest notes, private manager notes, and urgent replies — including message-only guests.
          </p>
        </div>
        <span className="shrink-0 self-start rounded-xl bg-rose-500/10 px-3 py-1.5 text-[11px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-300">
          {pendingReplyCount} awaiting reply
        </span>
      </div>

      <div className="border-b border-rose-100/60 p-4 sm:p-5 dark:border-white/5">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find by name, email, phone, or guest note..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs font-semibold outline-none focus:ring-1 focus:ring-rose-500/40 dark:border-white/10 dark:bg-slate-900"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <MessageCircle className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-white/10" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No leads to follow up yet</p>
          <p className="mt-1 text-xs text-slate-400">Contact saves and guest-only notes appear here.</p>
        </div>
      ) : (
        <div className="min-w-0 divide-y divide-rose-100/50 overflow-x-hidden dark:divide-white/5">
          {filtered.map((lead) => {
            const id = lead.id
            const open = activeId === id
            const name = lead.name || 'Unnamed'
            const noteValue = noteMap[id] !== undefined ? noteMap[id] : lead.privateNotes || ''
            const guestNote = getGuestNote(lead)
            const needsReply = !lead.lastReply

            return (
              <div
                key={id}
                className={cn(
                  'max-w-full min-w-0 overflow-x-hidden p-3.5 transition-colors sm:p-5',
                  open && 'bg-rose-50/60 ring-1 ring-rose-200/60 ring-inset dark:bg-rose-500/5 dark:ring-rose-500/20'
                )}
              >
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="min-w-0 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-black wrap-break-word text-slate-900 dark:text-white">{name}</p>
                      {needsReply ? (
                        <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[9px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-300">
                          Needs reply
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-300">
                          Replied
                        </span>
                      )}
                    </div>
                    <div className="mt-1 min-w-0 space-y-0.5 text-[11px] font-semibold text-slate-400">
                      <p className="truncate">{lead.email || 'No email'}</p>
                      <p className="truncate">
                        {lead.phone || 'No phone'} · {lead.profile?.name || 'vCard'}
                      </p>
                    </div>
                    {guestNote ? (
                      <p
                        className="mt-2 line-clamp-2 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-[11px] font-semibold wrap-break-word text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        title={guestNote}
                      >
                        <span className="mr-1.5 text-[9px] font-black tracking-wider text-amber-600 uppercase dark:text-amber-300">
                          Guest note
                        </span>
                        {guestNote}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[10px] font-semibold text-slate-400 italic">No guest note attached</p>
                    )}
                    {lead.lastReply && (
                      <p
                        className="mt-1 line-clamp-2 text-[10px] font-semibold wrap-break-word text-indigo-500"
                        title={lead.lastReply}
                      >
                        Last reply: {lead.lastReply}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveId(open ? null : id)}
                    className={cn(
                      'w-full rounded-xl px-4 py-2.5 text-[10px] font-black tracking-wider uppercase transition-all sm:w-auto',
                      open
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : needsReply
                          ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700'
                          : 'border border-indigo-500/20 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
                    )}
                  >
                    {open ? 'Close' : needsReply ? 'Reply now' : 'Add note / reply'}
                  </button>
                </div>

                {open && (
                  <div className="mt-4 min-w-0 space-y-3 sm:space-y-4">
                    <div className="min-w-0 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3.5 sm:p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-300">
                        <StickyNote className="h-3.5 w-3.5 shrink-0" /> Guest note
                      </p>
                      {guestNote ? (
                        <p className="text-xs leading-relaxed font-semibold wrap-break-word whitespace-pre-wrap text-slate-800 dark:text-slate-100">
                          {guestNote}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 italic">
                          No written note — you can still add a private note or reply.
                        </p>
                      )}
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4">
                      <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 dark:border-white/10 dark:bg-[#070a13]">
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                          <Save className="h-3.5 w-3.5" /> Private note
                        </p>
                        <textarea
                          value={noteValue}
                          onChange={(e) => setNoteMap((p) => ({ ...p, [id]: e.target.value }))}
                          placeholder="Internal notes about this lead..."
                          className="h-24 w-full max-w-full min-w-0 resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void savePrivateNote(id, lead.source)}
                          className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-black tracking-wider text-white uppercase disabled:opacity-60 sm:w-auto dark:bg-white/10"
                        >
                          Save Note
                        </button>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-rose-200/60 bg-rose-50/50 p-3.5 sm:p-4 dark:border-rose-500/20 dark:bg-rose-500/5">
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-300">
                          <MessageCircle className="h-3.5 w-3.5" /> Urgent reply
                        </p>
                        <p className="mb-2 text-[11px] font-semibold wrap-break-word text-slate-500 dark:text-slate-400">
                          Shown when {name} revisits your vCard.
                        </p>
                        <input
                          type="text"
                          value={replyMap[id] || ''}
                          onChange={(e) => setReplyMap((p) => ({ ...p, [id]: e.target.value }))}
                          placeholder={`Reply to ${name}...`}
                          className="w-full max-w-full min-w-0 rounded-xl border border-rose-200/70 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-rose-500/40 dark:border-rose-500/20 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void sendReply(id, lead.source)}
                          className="mt-2 w-full rounded-xl bg-rose-600 px-4 py-2.5 text-[10px] font-black tracking-wider text-white uppercase hover:bg-rose-700 disabled:opacity-60 sm:w-auto"
                        >
                          Send Urgent Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
