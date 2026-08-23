'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ContactSavesListSkeleton } from '@/components/admin/AdminLeadsListSkeleton'
import {
  CONTACT_SAVES_EVENT,
  ContactSaveRecord,
  deleteContactSave,
  getContactSavesForOwner,
  updateContactSaveNotes,
  updateContactSaveReply,
} from '@/lib/contactSaves'
import { MIN_IDENTITY_SEARCH_CHARACTERS, matchesIdentitySearch } from '@/lib/identitySearch'
import { cn } from '@/utils/cn'
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Globe,
  IdCard,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Phone,
  Save,
  Search,
  Trash2,
  User,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

type RoleScope = 'single' | 'corporate' | 'admin'

interface ContactSavesPanelProps {
  ownerId?: string | null
  role?: RoleScope
  title?: string
  subtitle?: string
  className?: string
  /** Tighter padding; does not create a nested scrollbar (parent scroll containers own scrolling). */
  compact?: boolean
  vCardIdFilter?: string | null
  enableLeadActions?: boolean
  /** When provided, skips localStorage and uses this list. */
  records?: ContactSaveRecord[]
  loading?: boolean
  onDelete?: (id: string) => void | Promise<void>
}

function formatWhen(iso: string) {
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

function initials(name: string) {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '?'
  )
}

export default function ContactSavesPanel({
  ownerId,
  role = 'single',
  title = 'Contact Saves',
  subtitle,
  className,
  compact = false,
  vCardIdFilter = null,
  enableLeadActions = false,
  records: recordsProp,
  loading = false,
  onDelete,
}: ContactSavesPanelProps) {
  const apiMode = recordsProp !== undefined
  const scopeKey = `${ownerId ?? ''}:${role}:${vCardIdFilter ?? ''}`
  const [localRecords, setLocalRecords] = useState<ContactSaveRecord[]>(() =>
    getContactSavesForOwner(ownerId, role, vCardIdFilter)
  )
  const [localScopeKey, setLocalScopeKey] = useState(scopeKey)
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null)
  const [cardFilter, setCardFilter] = useState('all')
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [replyMap, setReplyMap] = useState<Record<string, string>>({})
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  // Re-read localStorage when owner/filter scope changes (avoid setState-in-effect).
  if (!apiMode && localScopeKey !== scopeKey) {
    setLocalScopeKey(scopeKey)
    setLocalRecords(getContactSavesForOwner(ownerId, role, vCardIdFilter))
  }

  const refresh = () => {
    if (apiMode) return
    setLocalRecords(getContactSavesForOwner(ownerId, role, vCardIdFilter))
  }

  useEffect(() => {
    if (apiMode) return
    const onUpdate = () => {
      setLocalRecords(getContactSavesForOwner(ownerId, role, vCardIdFilter))
    }
    window.addEventListener(CONTACT_SAVES_EVENT, onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener(CONTACT_SAVES_EVENT, onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [ownerId, role, vCardIdFilter, apiMode])

  const records = useMemo(() => (apiMode ? (recordsProp ?? []) : localRecords), [apiMode, recordsProp, localRecords])

  const cardOptions = useMemo(() => {
    const map = new Map<string, string>()
    records.forEach((r) => map.set(r.vCardId, r.vCardName || r.vCardSlug))
    return Array.from(map.entries())
  }, [records])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesCard = cardFilter === 'all' || r.vCardId === cardFilter
      if (!matchesCard) return false
      return matchesIdentitySearch(query, [
        r.fullName,
        r.email,
        r.phoneNumber,
        r.vCardName,
        r.vCardSlug,
        r.ownerName,
        r.vCardDesignation,
        r.vCardProfession,
        r.vCardCompany,
      ])
    })
  }, [records, query, cardFilter])

  const handleExport = () => {
    const headers = [
      'Full Name',
      'Phone Number',
      'Email Address',
      'Date & Time Submitted',
      'vCard Name',
      'Private Notes',
      'Last Reply',
      'Device',
      'Browser',
      'Approx Location',
    ]
    const rows = filtered.map((r) => [
      r.fullName,
      r.phoneNumber,
      r.email,
      r.submittedAt,
      r.vCardName,
      r.privateNotes || '',
      r.lastReply || '',
      r.metadata?.device || '',
      r.metadata?.browser || '',
      r.metadata?.approximateLocation || '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contact-saves-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: 'Delete contact save?',
      description: 'Delete this contact save record?',
      onConfirm: () => {
        void (async () => {
          if (onDelete) {
            await onDelete(id)
          } else {
            deleteContactSave(id)
            refresh()
          }
          setConfirmState(null)
        })()
      },
    })
  }

  const handleSaveNote = (id: string) => {
    const text = noteMap[id] ?? records.find((r) => r.id === id)?.privateNotes ?? ''
    if (updateContactSaveNotes(id, text)) {
      refresh()
    }
  }

  const handleSendReply = (record: ContactSaveRecord) => {
    const text = (replyMap[record.id] || '').trim()
    if (!text) return
    if (updateContactSaveReply(record.id, text)) {
      try {
        localStorage.setItem(
          `vbiz_reply_notice_${record.vCardId}`,
          JSON.stringify({
            to: record.fullName,
            email: record.email,
            text,
            at: new Date().toISOString(),
          })
        )
      } catch {
        /* ignore */
      }
      setReplyMap((prev) => ({ ...prev, [record.id]: '' }))
      setReplyOpenId(null)
      refresh()
    }
  }

  const defaultSubtitle =
    role === 'single'
      ? 'People who saved your contact — tap a card for full details.'
      : 'Guest contact saves across your cards — clear list, easy to scan.'

  return (
    <div
      className={cn(
        'w-full max-w-full min-w-0 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:gap-4 sm:p-6 dark:border-white/5">
        <div className="min-w-0">
          <h3 className="flex items-start gap-2 text-base font-black tracking-tight text-slate-900 sm:items-center sm:text-lg dark:text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/15">
              <Save className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <span className="min-w-0 leading-snug wrap-break-word">{title}</span>
          </h3>
          <p className="mt-1.5 text-xs font-semibold wrap-break-word text-slate-400 sm:pl-13">
            {subtitle || defaultSubtitle}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 tabular-nums dark:bg-emerald-500/10 dark:text-emerald-300">
            {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
          </span>
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-[11px] font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50 disabled:opacity-40 sm:flex-none dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex min-w-0 flex-col gap-2.5 border-b border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-6 sm:py-4 dark:border-white/5 dark:bg-white/1.5">
        <div className="relative w-full min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, card, designation, or profession…"
            minLength={MIN_IDENTITY_SEARCH_CHARACTERS}
            className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm font-semibold outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#0b0f19]"
          />
        </div>
        <p className="px-1 text-[10px] font-semibold text-slate-400">
          Enter at least {MIN_IDENTITY_SEARCH_CHARACTERS} characters. Every search word must match the lead or
          source-card identity.
        </p>
        {(role === 'corporate' || role === 'admin') && !vCardIdFilter && (
          <select
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none dark:border-white/10 dark:bg-[#0b0f19]"
          >
            <option value="all">All source cards</option>
            {cardOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {loading ? (
        <ContactSavesListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
            <Save className="h-6 w-6 text-slate-300 dark:text-white/20" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {query.trim().length > 0 && query.trim().length < MIN_IDENTITY_SEARCH_CHARACTERS
              ? `Enter at least ${MIN_IDENTITY_SEARCH_CHARACTERS} characters to search`
              : 'No matching contact saves'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            When a guest shares their details on a public vCard, they show up here as a clear list.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'max-w-full min-w-0 space-y-3 overflow-x-hidden overflow-y-visible',
            compact ? 'p-2 sm:p-3' : 'p-3 sm:p-5'
          )}
        >
          {filtered.map((r) => {
            const open = expandedId === r.id
            const replyOpen = replyOpenId === r.id
            const noteValue = noteMap[r.id] !== undefined ? noteMap[r.id] : r.privateNotes || ''

            return (
              <article
                key={r.id}
                className={cn(
                  'max-w-full min-w-0 overflow-hidden rounded-2xl border transition-all duration-200',
                  open || replyOpen
                    ? 'border-emerald-300/70 bg-emerald-50/30 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/6'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/2 dark:hover:border-white/20'
                )}
              >
                {/* Card — stacked single column on mobile */}
                <div className="flex min-w-0 flex-col gap-3 p-3.5 sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-sm font-black text-white shadow-sm shadow-emerald-600/20 sm:h-12 sm:w-12">
                      {initials(r.fullName)}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                        <h4 className="max-w-full text-[14px] font-black tracking-tight wrap-break-word text-slate-900 sm:text-[15px] dark:text-white">
                          {r.fullName}
                        </h4>
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                            r.consent
                              ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'border-amber-200/70 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                          )}
                        >
                          {r.consent ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Consented
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" /> No consent
                            </>
                          )}
                        </span>
                      </div>

                      <div className="mt-2 flex min-w-0 flex-col gap-1">
                        <a
                          href={`mailto:${r.email}`}
                          className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-indigo-600 sm:text-[12.5px] dark:text-slate-300 dark:hover:text-indigo-400"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                          <span className="truncate">{r.email || 'No email'}</span>
                        </a>
                        <a
                          href={`tel:${r.phoneNumber}`}
                          className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-emerald-600 sm:text-[12.5px] dark:text-slate-300 dark:hover:text-emerald-400"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="break-all">{r.phoneNumber || 'No phone'}</span>
                        </a>
                      </div>

                      <div className="mt-2.5 flex min-w-0 flex-col gap-1 text-[11px] font-semibold text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{r.vCardName || 'vCard'}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatWhen(r.submittedAt)}
                        </span>
                        {r.guestMessage && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-amber-600 dark:text-amber-300">
                            <MessageCircle className="h-3 w-3" /> Guest note
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'grid w-full min-w-0 gap-2',
                      enableLeadActions ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-[1fr_auto]'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : r.id)}
                      className={cn(
                        'inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-xl px-2.5 py-2.5 text-[10px] font-black tracking-wider uppercase transition-colors sm:text-[11px]',
                        open
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                      )}
                    >
                      {open ? (
                        <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {open ? 'Hide' : 'Details'}
                    </button>
                    {enableLeadActions && (
                      <button
                        type="button"
                        onClick={() => setReplyOpenId(replyOpen ? null : r.id)}
                        className={cn(
                          'inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-xl px-2.5 py-2.5 text-[10px] font-black tracking-wider uppercase sm:text-[11px]',
                          replyOpen
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                        )}
                      >
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                        Reply
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="shrink-0 rounded-xl p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      title="Delete save"
                      aria-label="Delete save"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {(open || (replyOpen && enableLeadActions)) && (
                  <div className="min-w-0 space-y-3 overflow-x-hidden border-t border-emerald-100/60 bg-white/60 px-3.5 pt-0 pb-4 sm:space-y-4 sm:px-5 sm:pb-5 dark:border-emerald-500/15 dark:bg-black/10">
                    {r.guestMessage && open && (
                      <div className="mt-3 min-w-0 rounded-2xl border border-amber-200/50 bg-amber-50 p-3 sm:mt-4 sm:p-3.5 dark:border-amber-500/20 dark:bg-amber-500/10">
                        <p className="mb-1 text-[10px] font-black tracking-wider text-amber-600 uppercase">
                          Guest note
                        </p>
                        <p className="text-sm leading-relaxed font-semibold wrap-break-word whitespace-pre-wrap text-slate-800 dark:text-slate-100">
                          {r.guestMessage}
                        </p>
                      </div>
                    )}

                    {open && (
                      <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-2.5">
                        <MetaChip icon={Mail} label="Email" value={r.email} />
                        <MetaChip icon={Phone} label="Phone" value={r.phoneNumber} />
                        <MetaChip icon={IdCard} label="Source card" value={r.vCardName || r.vCardSlug} />
                        <MetaChip icon={Calendar} label="Saved at" value={formatWhen(r.submittedAt)} />
                        <MetaChip
                          icon={Monitor}
                          label="Device"
                          value={`${r.metadata?.device || '—'} · ${r.metadata?.browser || '—'}`}
                        />
                        <MetaChip icon={MapPin} label="Location" value={r.metadata?.approximateLocation || '—'} />
                        <MetaChip icon={Globe} label="Referrer" value={r.metadata?.referrer || 'Direct'} />
                        <MetaChip icon={User} label="Owner" value={r.ownerName || r.ownerId} />
                      </div>
                    )}

                    {enableLeadActions && open && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Private note</p>
                        <textarea
                          value={noteValue}
                          onChange={(e) => setNoteMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Internal note about this lead…"
                          className="h-20 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-emerald-500/50 dark:border-white/10 dark:bg-slate-900"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveNote(r.id)}
                            className="rounded-xl bg-slate-900 px-3.5 py-2 text-[11px] font-black text-white uppercase dark:bg-white dark:text-slate-900"
                          >
                            Save note
                          </button>
                        </div>
                      </div>
                    )}

                    {replyOpen && enableLeadActions && (
                      <div className="mt-2 space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                        <p className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-300">
                          <MessageCircle className="h-3.5 w-3.5" /> Reply to {r.fullName}
                        </p>
                        {r.lastReply && (
                          <p className="text-xs font-semibold text-slate-500">Last reply: {r.lastReply}</p>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={replyMap[r.id] || ''}
                            onChange={(e) => setReplyMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder={`Message for ${r.fullName}…`}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(r)}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[11px] font-black text-white uppercase hover:bg-indigo-700"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}

                    {open && r.vCardSlug && (
                      <a
                        href={`/v/${r.vCardSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400"
                      >
                        Open source card <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}

function MetaChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/4">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
        <Icon className="h-3 w-3 shrink-0" /> {label}
      </p>
      <p className="text-sm leading-snug font-bold break-all text-slate-800 dark:text-slate-100">{value || '—'}</p>
    </div>
  )
}
