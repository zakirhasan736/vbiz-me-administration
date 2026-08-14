'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

const NAME_WIDTHS = ['w-36', 'w-28', 'w-40', 'w-32', 'w-44', 'w-24', 'w-36', 'w-40'] as const
const ROLE_WIDTHS = ['w-28', 'w-32', 'w-24', 'w-36', 'w-28', 'w-32', 'w-24', 'w-28'] as const
const EMAIL_WIDTHS = ['w-40', 'w-36', 'w-44', 'w-32', 'w-40', 'w-36', 'w-28', 'w-44'] as const

/** Structured placeholder matching AdminUsers directory card layout. */
export function AdminUserCardSkeleton({ index = 0, className }: { index?: number; className?: string }) {
  const i = index % NAME_WIDTHS.length

  return (
    <div
      className={cn(
        'relative flex h-auto flex-col rounded-2xl border border-slate-200/60 bg-white dark:border-white/5 dark:bg-[#0b0f19]',
        className
      )}
      aria-hidden
    >
      <div className="flex flex-1 flex-col gap-2 p-3.5 pb-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className={cn('h-4 rounded-md', NAME_WIDTHS[i])} />
              <Skeleton variant="text" className={cn('h-2.5', ROLE_WIDTHS[i])} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-2 dark:border-white/10 dark:bg-slate-900">
          {[
            { labelW: 'w-10', valueW: EMAIL_WIDTHS[i] },
            { labelW: 'w-14', valueW: i % 2 === 0 ? 'w-28' : 'w-20' },
            { labelW: 'w-10', valueW: 'w-16' },
            { labelW: 'w-12', valueW: 'w-20' },
          ].map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-[56px_1fr] items-center gap-2">
              <Skeleton variant="text" className={cn('h-2', row.labelW)} />
              <Skeleton className={cn('ml-auto h-3 rounded-md', row.valueW)} />
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-1.5 border-t border-slate-100 pt-2 dark:border-white/5">
          <div className="grid grid-cols-2 gap-1.5">
            <Skeleton className="h-7 rounded-lg" />
            <Skeleton className="h-7 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Skeleton className="h-7 rounded-lg" />
            <Skeleton className="h-7 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

type AdminUserListSkeletonProps = {
  className?: string
  gridClassName?: string
  cardCount?: number
}

/** Structured user card skeletons for Admin Users directory loading. */
export function AdminUserListSkeleton({ className, gridClassName, cardCount = 8 }: AdminUserListSkeletonProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        gridClassName,
        className
      )}
      aria-busy="true"
      aria-label="Loading users"
    >
      {Array.from({ length: cardCount }).map((_, i) => (
        <AdminUserCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
