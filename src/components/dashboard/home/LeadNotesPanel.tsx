'use client'

import { notify } from '@/lib/toast/toast'
import { usePatchContactMutation } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { Loader2, MessageCircle, Search, StickyNote } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DashboardContact } from './ContactSavesPanel'

type LeadNotesPanelProps = {
  contacts?: DashboardContact[]
  notesCount?: number
  className?: string
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  isLoading?: boolean
  isError?: boolean
}

function getNote(contact: DashboardContact) {
  return (contact.message || '').trim()
}

export function LeadNotesPanel({
  contacts = [],
  notesCount,
  className,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  isLoading = false,
  isError = false,
}: LeadNotesPanelProps) {
  const [records, setRecords] = useState(contacts)
  const [prevContacts, setPrevContacts] = useState(contacts)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({})
  const [replyMap, setReplyMap] = useState<Record<string, string>>({})
  const [patchContact, { isLoading: saving }] = usePatchContactMutation()

  if (contacts !== prevContacts) {
    setPrevContacts(contacts)
    setRecords(contacts)
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return records
    return records.filter((c) => {
      const name = (c.name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      const note = getNote(c).toLowerCase()
      const card = (c.profile?.name || '').toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q) || note.includes(q) || card.includes(q)
    })
  }, [records, query])

  const displayTotal = notesCount ?? records.length
  const awaitingReply = records.filter((r) => !r.lastReply).length

  const savePrivateNote = async (id: string, source?: DashboardContact['source']) => {
    const value = privateNotes[id] ?? records.find((r) => r.id === id)?.privateNotes ?? ''
    try {
      const updated = await patchContact({ id, privateNotes: value, source: source ?? 'note' }).unwrap()
      setRecords((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                privateNotes: updated.privateNotes ?? value,
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

  const sendReply = async (id: string, source?: DashboardContact['source']) => {
    const text = (replyMap[id] || '').trim()
    if (!text) return
    try {
      const updated = await patchContact({ id, lastReply: text, source: source ?? 'note' }).unwrap()
      setRecords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, lastReply: updated.lastReply ?? text } : item))
      )
      setReplyMap((p) => ({ ...p, [id]: '' }))
      notify.success('Reply saved.')
    } catch (e) {
      const message =
        (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not send reply.'
      notify.error(message)
    }
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="shrink-0 px-4 pb-3 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-200/70 bg-indigo-50/80 px-3 py-2.5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <StickyNote className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-200/90">
            {displayTotal > 0
              ? `${displayTotal.toLocaleString()} note${displayTotal === 1 ? '' : 's'} · ${awaitingReply} awaiting reply`
              : 'Guest notes & private replies'}
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
        {isLoading && records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Loading notes…</p>
          </div>
        ) : isError && records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10">
              <MessageCircle className="h-6 w-6 text-rose-400" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Could not load notes</p>
            <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">
              Try closing and opening this panel again.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
              <MessageCircle className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {query.trim() ? 'No matching notes' : 'No notes yet'}
            </p>
            <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">
              {query.trim()
                ? 'Try a different name, email, or note text.'
                : 'Visitor messages left with contact saves will show up here for follow-up.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((contact) => {
              const open = activeId === contact.id
              const noteValue =
                privateNotes[contact.id] !== undefined ? privateNotes[contact.id] : contact.privateNotes || ''
              const guestNote = getNote(contact)
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {contact.name || 'Guest'}
                        </p>
                        {contact.lastReply ? (
                          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-300">
                            Replied
                          </span>
                        ) : (
                          <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-300">
                            Needs reply
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {guestNote || 'No guest note text'}
                      </p>
                      {contact.profile?.name ? (
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                          {contact.profile.name}
                        </p>
                      ) : null}
                    </div>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-slate-100 px-4 py-3 dark:border-white/5">
                      {guestNote ? (
                        <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                          <p className="mb-1 text-[10px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-300">
                            Guest note
                          </p>
                          <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                            {guestNote}
                          </p>
                        </div>
                      ) : null}
                      {contact.lastReply ? (
                        <p className="text-[11px] font-semibold text-indigo-500">Last reply: {contact.lastReply}</p>
                      ) : null}
                      <div>
                        <label className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase">
                          Private note
                        </label>
                        <textarea
                          value={noteValue}
                          onChange={(e) => setPrivateNotes((prev) => ({ ...prev, [contact.id]: e.target.value }))}
                          rows={3}
                          placeholder="Add a private follow-up note…"
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void savePrivateNote(contact.id, contact.source)}
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black tracking-wider text-white uppercase transition-colors hover:bg-indigo-700 disabled:opacity-60"
                      >
                        Save note
                      </button>
                      <div>
                        <label className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase">
                          Reply
                        </label>
                        <textarea
                          value={replyMap[contact.id] || ''}
                          onChange={(e) => setReplyMap((prev) => ({ ...prev, [contact.id]: e.target.value }))}
                          rows={3}
                          placeholder="Reply shown when they revisit the vCard…"
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        />
                        <button
                          type="button"
                          disabled={saving || !(replyMap[contact.id] || '').trim()}
                          onClick={() => void sendReply(contact.id, contact.source)}
                          className="mt-2 rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-black tracking-wider text-white uppercase transition-colors hover:bg-rose-700 disabled:opacity-60"
                        >
                          Send reply
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {hasMore && onLoadMore ? (
          <div className="flex justify-center pt-3">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-[11px] font-black tracking-wider text-indigo-700 uppercase hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              {loadingMore
                ? 'Loading…'
                : `Show more (${Math.max(0, displayTotal - records.length).toLocaleString()} remaining)`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
