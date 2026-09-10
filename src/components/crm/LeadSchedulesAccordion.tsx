'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { type LeadScheduleRow, useGetCrmLeadSchedulesQuery } from '@/redux/features/crm/crm.api'
import { cn } from '@/utils/cn'
import { Calendar, ChevronDown, Plus } from 'lucide-react'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function statusTone(status: string) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
  if (status === 'Cancelled') return 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
  return 'bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200'
}

export function LeadSchedulesAccordion({
  leadId,
  onCollapse,
  onCreate,
  onOpenItem,
}: {
  leadId: string
  onCollapse?: () => void
  onCreate: () => void
  onOpenItem: (item: LeadScheduleRow) => void
}) {
  const { data: items = [], isLoading, isError, error } = useGetCrmLeadSchedulesQuery(leadId)

  return (
    <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-3 dark:border-teal-500/20 dark:bg-teal-500/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black tracking-wider text-teal-700 uppercase dark:text-teal-200">
          Schedules ({items.length})
        </p>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black tracking-wider text-teal-700 uppercase hover:bg-teal-100/80 dark:text-teal-200 dark:hover:bg-teal-500/20"
          >
            Collapse
            <ChevronDown className="h-3.5 w-3.5 rotate-180" aria-hidden />
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">
          {error && typeof error === 'object' && 'data' in error
            ? String((error as { data?: { message?: string } }).data?.message || 'Couldn’t load schedules.')
            : 'Couldn’t load schedules.'}
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No schedules for this lead yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpenItem(item)}
                className="flex w-full cursor-pointer items-start gap-2 rounded-xl border border-teal-200/60 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-teal-500/15 dark:bg-[#0b1018] dark:hover:bg-teal-500/10"
              >
                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.type}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                        statusTone(item.status)
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.date} · {item.time}
                    {item.startsAt ? ` · ${formatWhen(item.startsAt)}` : ''}
                  </p>
                  {item.notes?.trim() ? (
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2.5 text-[10px] font-black tracking-wider text-white uppercase hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          <Plus className="h-3.5 w-3.5" /> Create schedule
        </button>
      </div>
    </div>
  )
}
