'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

const BODY_WIDTHS = ['w-full', 'w-5/6', 'w-11/12', 'w-4/5', 'w-full', 'w-3/4'] as const
const TITLE_WIDTHS = ['w-40', 'w-36', 'w-48', 'w-32', 'w-44', 'w-28'] as const
const META_WIDTHS = ['w-36', 'w-44', 'w-32', 'w-40', 'w-48', 'w-28'] as const
const TYPE_WIDTHS = ['w-14', 'w-16', 'w-12', 'w-14', 'w-16', 'w-12'] as const
const HOST_WIDTHS = ['w-28', 'w-36', 'w-24', 'w-32', 'w-40', 'w-20'] as const

/** Header “Banner live” / “No live banner” pill placeholder. */
export function AnnouncementsLiveStatusSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-8 w-28 self-start rounded-xl', className)} aria-hidden />
}

/** Preview panel body; keep the PREVIEW label in the parent. */
export function AnnouncementsPreviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true" aria-label="Loading preview">
      <Skeleton className="h-4 w-full max-w-md rounded-md" />
      <Skeleton className="h-4 w-4/5 max-w-sm rounded-md" />
    </div>
  )
}

export function RecentPublishCardSkeleton({ index = 0 }: { index?: number }) {
  const i = index % BODY_WIDTHS.length

  return (
    <div
      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/2"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-2">
        <Skeleton className={cn('h-4 rounded-md', TYPE_WIDTHS[i])} />
        <Skeleton className={cn('h-2.5 shrink-0 rounded-md', META_WIDTHS[i])} />
      </div>
      <Skeleton variant="text" className={cn('mt-2 h-2.5', BODY_WIDTHS[i])} />
      {i % 2 === 0 ? <Skeleton variant="text" className="mt-1.5 h-2.5 w-3/5" /> : null}
    </div>
  )
}

type ListSkeletonProps = {
  className?: string
  count?: number
}

/** Recent publish cards matching Live Banner list layout. */
export function RecentPublishesListSkeleton({ className, count = 6 }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true" aria-label="Loading recent publishes">
      {Array.from({ length: count }).map((_, i) => (
        <RecentPublishCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}

/** Amber count pill for Warnings & Notices header. */
export function WarningsCountSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-7 w-24 shrink-0 rounded-lg', className)} aria-hidden />
}

export function WarningNoticeRowSkeleton({ index = 0 }: { index?: number }) {
  const i = index % TITLE_WIDTHS.length

  return (
    <div className="flex flex-col justify-between gap-3 px-6 py-4 sm:flex-row sm:items-start" aria-hidden>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Skeleton className={cn('h-4 rounded-md', TYPE_WIDTHS[i])} />
          <Skeleton className="h-3.5 w-14 rounded-md" />
          <Skeleton className={cn('h-2.5 rounded-md', META_WIDTHS[i])} />
        </div>
        <Skeleton className={cn('h-4 rounded-md', TITLE_WIDTHS[i])} />
        <Skeleton variant="text" className={cn('mt-2 h-2.5', BODY_WIDTHS[i])} />
        {i % 3 !== 2 ? <Skeleton variant="text" className="mt-1.5 h-2.5 w-2/3" /> : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
    </div>
  )
}

/** Warnings & notice history rows. */
export function WarningsNoticesListSkeleton({ className, count = 5 }: ListSkeletonProps) {
  return (
    <div
      className={cn('divide-y divide-slate-100 dark:divide-white/5', className)}
      aria-busy="true"
      aria-label="Loading warnings and notices"
    >
      {Array.from({ length: count }).map((_, i) => (
        <WarningNoticeRowSkeleton key={i} index={i} />
      ))}
    </div>
  )
}

/** Indigo count pill for Upcoming events header. */
export function EventsCountSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-7 w-24 shrink-0 rounded-lg', className)} aria-hidden />
}

export function UpcomingEventCardSkeleton({ index = 0 }: { index?: number }) {
  const i = index % HOST_WIDTHS.length

  return (
    <div
      className="flex flex-col justify-between gap-3 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-4 sm:flex-row sm:items-center dark:bg-indigo-500/10"
      aria-hidden
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className={cn('h-2.5 rounded-md', TYPE_WIDTHS[i])} />
        <Skeleton className={cn('h-4 rounded-md', HOST_WIDTHS[i])} />
        <Skeleton variant="text" className={cn('h-2.5', META_WIDTHS[i])} />
      </div>
      <Skeleton className="h-8 w-16 shrink-0 self-start rounded-xl" />
    </div>
  )
}

/** Upcoming event cards matching the scheduled list layout. */
export function UpcomingEventsListSkeleton({ className, count = 5 }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading upcoming events">
      {Array.from({ length: count }).map((_, i) => (
        <UpcomingEventCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
