'use client'

import { notify } from '@/lib/toast/toast'
import { useListCardChangeHistoryQuery, useRestoreCardChangeMutation } from '@/redux/features/profiles/profiles.api'
import { History, Loader2, RotateCcw } from 'lucide-react'

function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function CardChangeHistoryPanel({ cardId }: { cardId?: string }) {
  const profileId = cardId?.trim() || ''
  const { data, isLoading, isError, refetch } = useListCardChangeHistoryQuery({ id: profileId }, { skip: !profileId })
  const [restoreChange, restoreState] = useRestoreCardChangeMutation()
  const items = data?.items || []

  const onRestore = async (historyId: string) => {
    if (!profileId) return
    try {
      await restoreChange({ id: profileId, historyId }).unwrap()
      notify.success('That change was restored.')
      await refetch()
    } catch (error) {
      const apiError = error as { data?: { message?: string }; message?: string }
      notify.error(apiError.data?.message || apiError.message || 'This change could not be restored.')
    }
  }

  if (!profileId) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-[#070a13] dark:text-slate-400">
        Save the card first to start collecting change history.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm font-medium text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
      </div>
    )
  }

  if (isError) {
    return <p className="p-6 text-sm font-medium text-rose-600">Could not load change history.</p>
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-sm font-medium text-slate-500 dark:border-white/10 dark:bg-[#070a13] dark:text-slate-400">
        No builder changes recorded yet. Edits to services, settings, and other card areas will appear here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((row) => {
        const restoreBusy = restoreState.isLoading && restoreState.originalArgs?.historyId === row.id
        const restoreDisabled = !row.canRestore || restoreState.isLoading
        const restoreTitle = row.canRestore
          ? 'Restore this change'
          : 'Data life expired — this change cannot be restored'

        return (
          <article
            key={row.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#070a13]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-700 uppercase dark:bg-white/10 dark:text-slate-200">
                    {row.areaLabel}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-800 uppercase dark:bg-amber-500/15 dark:text-amber-200">
                    {row.action}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{row.summary}</p>
                <dl className="mt-3 grid gap-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400">When: </span>
                    {formatWhen(row.createdAt)}
                  </div>
                  <div>
                    <span className="text-slate-400">Who: </span>
                    {row.actorName} · {row.actorRoleLabel}
                  </div>
                  <div>
                    <span className="text-slate-400">Device: </span>
                    {row.device}
                  </div>
                  <div>
                    <span className="text-slate-400">Location: </span>
                    {row.location}
                  </div>
                </dl>
              </div>
              <button
                type="button"
                disabled={restoreDisabled}
                title={restoreTitle}
                onClick={() => void onRestore(row.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-slate-100 dark:enabled:hover:bg-white/5"
              >
                {restoreBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Restore
              </button>
            </div>
          </article>
        )
      })}
      <p className="flex items-start gap-2 px-1 text-[12px] font-medium text-slate-400">
        <History className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Restore copies are kept for 72 hours. After that the list stays, but Restore is disabled.
      </p>
    </div>
  )
}
