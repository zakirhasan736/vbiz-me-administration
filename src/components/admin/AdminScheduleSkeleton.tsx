'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { Calendar, Clock } from 'lucide-react'

const TYPE_WIDTHS = ['w-24', 'w-28'] as const
const TITLE_WIDTHS = ['w-40', 'w-36'] as const
const DATE_WIDTHS = ['w-20', 'w-24'] as const
const TIME_WIDTHS = ['w-16', 'w-14'] as const

/** Layout-matched meeting card; keeps Calendar/Clock icons, skeletons only dynamic fields. */
export function MeetingCardSkeleton({ index = 0, className }: { index?: number; className?: string }) {
  const i = index % TYPE_WIDTHS.length

  return (
    <div
      className={cn(
        'flex flex-col justify-between space-y-4 rounded-3xl border border-indigo-500/15 bg-indigo-500/5 p-5 dark:bg-indigo-500/10',
        className
      )}
      aria-hidden
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className={cn('h-2.5 rounded-md', TYPE_WIDTHS[i])} />
            <Skeleton className={cn('mt-2 h-4 rounded-md', TITLE_WIDTHS[i])} />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 rounded-lg" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Skeleton className={cn('h-3 rounded-md', DATE_WIDTHS[i])} />
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-slate-400" />
            <Skeleton className={cn('h-3 rounded-md', TIME_WIDTHS[i])} />
          </span>
        </div>
      </div>

      <div className="flex gap-2 border-t border-slate-200/40 pt-4 dark:border-white/5">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-11 shrink-0 rounded-xl" />
        <Skeleton className="h-9 w-11 shrink-0 rounded-xl" />
      </div>
    </div>
  )
}

type AdminScheduleListSkeletonProps = {
  className?: string
  cardCount?: number
}

/** Two meeting-card skeletons for Admin Schedule loading. */
export function AdminScheduleListSkeleton({ className, cardCount = 2 }: AdminScheduleListSkeletonProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-6 md:grid-cols-2', className)}
      aria-busy="true"
      aria-label="Loading schedules"
    >
      {Array.from({ length: cardCount }).map((_, i) => (
        <MeetingCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}

/** Month grid placeholder for Admin Schedule calendar. */
export function AdminScheduleCalendarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading schedule calendar">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`dow-${i}`} className="h-6 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="min-h-22 rounded-xl border border-slate-100 p-1.5 dark:border-white/10">
            <Skeleton className="h-3 w-5 rounded-md" />
            <Skeleton className="mt-2 h-4 w-full rounded-md" />
            {i % 3 === 0 ? <Skeleton className="mt-1 h-4 w-4/5 rounded-md" /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
