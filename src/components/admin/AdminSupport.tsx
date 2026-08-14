'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import {
  AdminSupportDetailSkeleton,
  AdminSupportOpenCountSkeleton,
  AdminSupportTicketListSkeleton,
} from '@/components/admin/AdminSupportSkeleton'
import {
  useDeleteSupportTicketMutation,
  useGetSupportTicketsQuery,
  useUpdateSupportTicketMutation,
} from '@/redux/features/adminSupport/adminSupport.api'
import type { TicketStatus } from '@/types/support'
import { cn } from '@/utils/cn'
import { Ban, Inbox, LifeBuoy, Loader2, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'

/**
 * Admin is the system owner — Support is ticket inbox only.
 * AI help and “email support” are owner-facing (single/corporate), not admin tools.
 */
export default function AdminSupport() {
  const [filter, setFilter] = useState<'all' | TicketStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { data, isLoading, isError, isFetching } = useGetSupportTicketsQuery({
    status: filter === 'all' ? undefined : filter,
    limit: 100,
  })
  const [updateTicket, { isLoading: isUpdating }] = useUpdateSupportTicketMutation()
  const [deleteTicket, { isLoading: isDeleting }] = useDeleteSupportTicketMutation()

  const tickets = data?.items ?? []
  const openCount = data?.openCount ?? 0
  const selected = (selectedId ? tickets.find((t) => t.id === selectedId) : undefined) ?? tickets[0] ?? null
  const busy = isUpdating || isDeleting

  const handleStatus = async (status: TicketStatus) => {
    if (!selected) return
    try {
      await updateTicket({
        id: selected.id,
        body: {
          status,
          ...(reply.trim() ? { adminReply: reply.trim() } : {}),
        },
      }).unwrap()
      setReply('')
    } catch {
      // RTK error surface; keep reply so admin can retry
    }
  }

  const handleToggleBlocked = async () => {
    if (!selected) return
    try {
      await updateTicket({
        id: selected.id,
        body: { blocked: !selected.blocked },
      }).unwrap()
    } catch {
      // keep UI as-is on failure
    }
  }

  const handleConfirmDelete = async () => {
    if (!selected) return
    const deletedId = selected.id
    const nextId = tickets.find((t) => t.id !== deletedId)?.id ?? null
    try {
      await deleteTicket(deletedId).unwrap()
      setSelectedId(nextId)
      setReply('')
      setConfirmDeleteOpen(false)
    } catch {
      // keep confirm open so admin can retry
    }
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-4 duration-300 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <LifeBuoy className="h-7 w-7 text-indigo-500" />
            Support Tickets
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Inbox for single and corporate owners — feedback and email support tickets land here.
          </p>
        </div>
        {isLoading ? (
          <AdminSupportOpenCountSkeleton />
        ) : (
          <span className="self-start rounded-xl bg-rose-500/10 px-3 py-1.5 text-[11px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-300">
            {openCount} open
          </span>
        )}
      </div>

      <div className="grid min-h-140 grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="border-b border-slate-100 p-4 dark:border-white/5">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as 'all' | TicketStatus)
                setSelectedId(null)
                setReply('')
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-slate-900"
            >
              <option value="all">All tickets</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
            {isLoading ? (
              <AdminSupportTicketListSkeleton />
            ) : isError ? (
              <div className="px-4 py-16 text-center">
                <Inbox className="mx-auto mb-2 h-8 w-8 text-rose-300" />
                <p className="text-xs font-bold text-rose-500">Could not load tickets</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-500">No owner tickets yet</p>
              </div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(t.id)
                    setReply('')
                  }}
                  className={cn(
                    'w-full px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-white/2',
                    selected?.id === t.id && 'bg-indigo-50/70 dark:bg-indigo-500/10'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-900 dark:text-white">{t.subject}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      {t.blocked && (
                        <span className="rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase dark:bg-white/20">
                          Blocked
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase',
                          t.status === 'open' && 'bg-rose-500/15 text-rose-600',
                          t.status === 'in_progress' && 'bg-amber-500/15 text-amber-600',
                          t.status === 'closed' && 'bg-emerald-500/15 text-emerald-600'
                        )}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
                    {t.fromName} · {t.fromRole} · {t.channel}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="relative flex flex-col rounded-[28px] border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0b0f19]">
          {isFetching && !isLoading && (
            <div className="absolute top-4 right-4">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            </div>
          )}
          {isLoading ? (
            <AdminSupportDetailSkeleton />
          ) : !selected ? (
            <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-400">
              Select an owner ticket to review
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black tracking-wider text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300">
                    {selected.channel}
                  </span>
                  <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:bg-indigo-500/10">
                    {selected.type}
                  </span>
                  {selected.blocked && (
                    <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black tracking-wider text-white uppercase dark:bg-white/20">
                      Blocked
                    </span>
                  )}
                  {typeof selected.rating === 'number' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {selected.rating}/5
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{selected.subject}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  From {selected.fromName} ({selected.fromRole}){selected.fromEmail ? ` · ${selected.fromEmail}` : ''} ·{' '}
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                {selected.blocked && (
                  <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
                    This owner cannot send new support or feedback tickets while this ticket is blocked.
                  </p>
                )}
              </div>
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold whitespace-pre-wrap text-slate-700 dark:border-white/5 dark:bg-slate-900/60 dark:text-slate-200">
                {selected.details}
              </div>
              {selected.adminReply && (
                <div className="mt-3 rounded-xl border border-emerald-200/50 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="mb-1 text-[10px] font-black text-emerald-600 uppercase">Your reply</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selected.adminReply}</p>
                </div>
              )}
              <div className="mt-4 space-y-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply note to the owner..."
                  disabled={busy}
                  className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60 dark:border-white/10 dark:bg-slate-900"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleStatus('in_progress')}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-[10px] font-black tracking-wider text-white uppercase disabled:opacity-60"
                  >
                    Mark in progress
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleStatus('closed')}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black tracking-wider text-white uppercase disabled:opacity-60"
                  >
                    Close & notify owner
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleStatus('open')}
                    className="rounded-xl bg-slate-200 px-4 py-2 text-[10px] font-black tracking-wider text-slate-700 uppercase disabled:opacity-60 dark:bg-white/10 dark:text-slate-200"
                  >
                    Reopen
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleToggleBlocked()}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[10px] font-black tracking-wider text-white uppercase disabled:opacity-60',
                      selected.blocked ? 'bg-slate-700' : 'bg-rose-700'
                    )}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    {selected.blocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 px-4 py-2 text-[10px] font-black tracking-wider text-rose-700 uppercase disabled:opacity-60 dark:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete support ticket?"
        description={
          selected
            ? `Permanently delete “${selected.subject}” from ${selected.fromName}? This cannot be undone.`
            : 'Permanently delete this support ticket? This cannot be undone.'
        }
        confirmLabel="Delete"
        variant="danger"
        icon={Trash2}
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          if (!isDeleting) setConfirmDeleteOpen(false)
        }}
      />
    </div>
  )
}
