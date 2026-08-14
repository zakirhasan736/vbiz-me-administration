'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

/** Dashed create-tile placeholder matching Admin My Cards / VCards create launcher. */
export function CreateNewCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-87.5 flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-[#070a13]',
        className
      )}
      aria-hidden
    >
      <Skeleton className="mb-4 h-14 w-14 rounded-2xl" />
      <Skeleton className="h-4 w-36 rounded-md" />
      <Skeleton variant="text" className="mt-3 h-2.5 w-44 max-w-full" />
      <Skeleton variant="text" className="mt-1.5 h-2.5 w-36 max-w-full" />
    </div>
  )
}

/** Structured placeholder matching AdminDirectoryVCardTeamCard layout. */
export function VCardTeamCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-auto flex-col rounded-2xl border border-slate-200/60 bg-white dark:border-white/5 dark:bg-[#0b0f19]',
        className
      )}
      aria-hidden
    >
      <div className="absolute top-2.5 right-2.5">
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5 pb-4">
        <div>
          <div className="flex items-start justify-between gap-2 pr-7">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>

          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton variant="text" className="h-2.5 w-28" />
              <Skeleton variant="text" className="h-2.5 w-24" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Skeleton variant="text" className="h-2 w-10" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 px-1.5 py-1.5 dark:border-white/10 dark:bg-slate-900">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn('space-y-1 text-center', i === 1 && 'border-x border-slate-200 dark:border-white/10')}
            >
              <Skeleton variant="text" className="mx-auto h-2 w-8" />
              <Skeleton className="mx-auto h-3.5 w-10 rounded-md" />
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-2 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-6 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="mt-auto shrink-0 space-y-1.5 border-t border-slate-100 pt-2 dark:border-white/5">
          <div className="grid grid-cols-3 gap-1.5">
            <Skeleton className="h-7 rounded-lg" />
            <Skeleton className="h-7 rounded-lg" />
            <Skeleton className="h-7 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

type VCardDirectoryListSkeletonProps = {
  className?: string
  /** Extra class on the outer grid (e.g. `pt-2` for Admin VCards). */
  gridClassName?: string
  cardCount?: number
}

/** Create New tile + structured vCard card skeletons for directory loading states. */
export function VCardDirectoryListSkeleton({
  className,
  gridClassName,
  cardCount = 7,
}: VCardDirectoryListSkeletonProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', gridClassName, className)}
      aria-busy="true"
      aria-label="Loading cards"
    >
      <CreateNewCardSkeleton />
      {Array.from({ length: cardCount }).map((_, i) => (
        <VCardTeamCardSkeleton key={i} />
      ))}
    </div>
  )
}
