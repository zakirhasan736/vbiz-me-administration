'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

const SUBJECT_WIDTHS = ['w-40', 'w-32', 'w-44', 'w-36', 'w-28', 'w-40', 'w-36'] as const
const META_WIDTHS = ['w-36', 'w-40', 'w-28', 'w-44', 'w-32', 'w-36', 'w-40'] as const
const CHIP_WIDTHS = ['w-12', 'w-14', 'w-16', 'w-12', 'w-14', 'w-12', 'w-16'] as const

function AdminSupportTicketRowSkeleton({ index = 0 }: { index?: number }) {
  const i = index % SUBJECT_WIDTHS.length

  return (
    <div className="px-4 py-3.5" aria-hidden>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className={cn('h-3.5 rounded-md', SUBJECT_WIDTHS[i])} />
        <Skeleton className={cn('h-4 shrink-0 rounded-md', CHIP_WIDTHS[i])} />
      </div>
      <Skeleton variant="text" className={cn('mt-2 h-2.5', META_WIDTHS[i])} />
    </div>
  )
}

type AdminSupportTicketListSkeletonProps = {
  className?: string
  rowCount?: number
}

/** Ticket list row skeletons matching AdminSupport inbox rows. */
export function AdminSupportTicketListSkeleton({ className, rowCount = 7 }: AdminSupportTicketListSkeletonProps) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading tickets">
      {Array.from({ length: rowCount }).map((_, i) => (
        <AdminSupportTicketRowSkeleton key={i} index={i} />
      ))}
    </div>
  )
}

/** Detail panel skeleton matching AdminSupport selected-ticket layout. */
export function AdminSupportDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-1 flex-col', className)} aria-busy="true" aria-label="Loading ticket">
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-6 w-14 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-2/3 max-w-md rounded-md" />
        <Skeleton variant="text" className="mt-2 h-2.5 w-1/2 max-w-sm" />
      </div>
      <Skeleton className="min-h-40 w-full flex-1 rounded-2xl" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/** Header open-count pill placeholder. */
export function AdminSupportOpenCountSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-8 w-20 self-start rounded-xl', className)} aria-hidden />
}
