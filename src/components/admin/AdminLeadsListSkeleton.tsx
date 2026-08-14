'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

const NAME_WIDTHS = ['w-28', 'w-36', 'w-24', 'w-40', 'w-32'] as const
const EMAIL_WIDTHS = ['w-40', 'w-36', 'w-44', 'w-32', 'w-48'] as const
const PHONE_WIDTHS = ['w-28', 'w-24', 'w-32', 'w-20', 'w-28'] as const
const META_WIDTHS = ['w-36', 'w-44', 'w-32', 'w-40', 'w-48'] as const

export function ContactSaveRowSkeleton({ index = 0 }: { index?: number }) {
  const i = index % NAME_WIDTHS.length

  return (
    <div
      className="max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/2"
      aria-hidden
    >
      <div className="flex min-w-0 flex-col gap-3 p-3.5 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-2xl sm:h-12 sm:w-12" />
          <div className="min-w-0 flex-1 space-y-2 overflow-hidden">
            <div className="flex flex-wrap items-center gap-1.5">
              <Skeleton className={cn('h-4 rounded-md', NAME_WIDTHS[i])} />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton variant="text" className={cn('h-2.5', EMAIL_WIDTHS[i])} />
            <Skeleton variant="text" className={cn('h-2.5', PHONE_WIDTHS[i])} />
            <Skeleton variant="text" className={cn('mt-1 h-2.5', META_WIDTHS[i])} />
          </div>
        </div>
        <div className="grid w-full min-w-0 grid-cols-[1fr_auto] gap-2">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

type ListSkeletonProps = {
  className?: string
  count?: number
}

/** Layout-matched skeletons for Admin Leads contact-save rows. */
export function ContactSavesListSkeleton({ className, count = 5 }: ListSkeletonProps) {
  return (
    <div
      className={cn('max-w-full min-w-0 space-y-3 overflow-x-hidden p-3 sm:p-5', className)}
      aria-busy="true"
      aria-label="Loading contact saves"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ContactSaveRowSkeleton key={i} index={i} />
      ))}
    </div>
  )
}

export function LeadNoteRowSkeleton({ index = 0 }: { index?: number }) {
  const i = index % NAME_WIDTHS.length

  return (
    <div className="max-w-full min-w-0 overflow-x-hidden p-3.5 sm:p-5" aria-hidden>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="min-w-0 space-y-2 overflow-hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className={cn('h-4 rounded-md', NAME_WIDTHS[i])} />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton variant="text" className={cn('h-2.5', EMAIL_WIDTHS[i])} />
          <Skeleton variant="text" className={cn('h-2.5', PHONE_WIDTHS[i])} />
          <Skeleton className="mt-1 h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl sm:w-36" />
      </div>
    </div>
  )
}

/** Layout-matched skeletons for Admin Leads notes/replies rows. */
export function LeadNotesListSkeleton({ className, count = 5 }: ListSkeletonProps) {
  return (
    <div
      className={cn('min-w-0 divide-y divide-rose-100/50 overflow-x-hidden dark:divide-white/5', className)}
      aria-busy="true"
      aria-label="Loading lead notes"
    >
      {Array.from({ length: count }).map((_, i) => (
        <LeadNoteRowSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
