'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { type LeadEventRow, useGetCrmLeadEventsQuery } from '@/redux/features/crm/crm.api'
import { cn } from '@/utils/cn'
import { CalendarHeart, ChevronDown, Plus } from 'lucide-react'

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
  return 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200'
}

export function LeadEventsAccordion({
  leadId,
  onCollapse,
  onCreate,
  onOpenItem,
}: {
  leadId: string
  onCollapse?: () => void
  onCreate: () => void
  onOpenItem: (item: LeadEventRow) => void
}) {
  const { data: items = [], isLoading, isError, error } = useGetCrmLeadEventsQuery(leadId)

  return (
    <div className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black tracking-wider text-rose-700 uppercase dark:text-rose-200">
          Wish & Outreach ({items.length})
        </p>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black tracking-wider text-rose-700 uppercase hover:bg-rose-100/80 dark:text-rose-200 dark:hover:bg-rose-500/20"
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
            ? String((error as { data?: { message?: string } }).data?.message || 'Couldn’t load events.')
            : 'Couldn’t load events.'}
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          No wish or outreach items for this lead yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpenItem(item)}
                className="flex w-full cursor-pointer items-start gap-2 rounded-xl border border-rose-200/60 bg-white p-3 text-left transition hover:border-rose-300 hover:bg-rose-50/50 dark:border-rose-500/15 dark:bg-[#0b1018] dark:hover:bg-rose-500/10"
              >
                <CalendarHeart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-300" />
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
                  {item.description?.trim() ? (
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {item.description}
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
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2.5 text-[10px] font-black tracking-wider text-white uppercase hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400"
        >
          <Plus className="h-3.5 w-3.5" /> Create wish & outreach
        </button>
      </div>
    </div>
  )
}
