'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

const NAME_WIDTHS = ['w-36', 'w-32', 'w-40'] as const
const DESC_WIDTHS = ['w-full', 'w-5/6', 'w-11/12'] as const
const DESC2_WIDTHS = ['w-4/5', 'w-3/4', 'w-5/6'] as const
const USES_WIDTHS = ['w-8', 'w-10', 'w-7'] as const

/** Structured placeholder matching AdminTemplates card layout. */
export function AdminTemplateCardSkeleton({ index = 0, className }: { index?: number; className?: string }) {
  const i = index % NAME_WIDTHS.length
  const isCenteredPreview = index === 1

  return (
    <div
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
        className
      )}
      aria-hidden
    >
      <div className="relative flex h-40 items-center justify-center p-4">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="relative z-10 flex h-full w-full flex-col gap-2 rounded-xl border border-white/20 bg-white/20 p-3 shadow-sm backdrop-blur-md">
          {isCenteredPreview ? (
            <>
              <Skeleton className="h-6 w-full rounded bg-white/50" />
              <Skeleton variant="circle" className="mx-auto h-8 w-8 bg-white/60" />
              <div className="mt-auto grid grid-cols-3 gap-1">
                <Skeleton className="h-3 rounded bg-white/40" />
                <Skeleton className="h-3 rounded bg-white/40" />
                <Skeleton className="h-3 rounded bg-white/40" />
              </div>
            </>
          ) : (
            <>
              <Skeleton variant="circle" className="h-10 w-10 bg-white/50" />
              <Skeleton className="h-3 w-24 rounded-full bg-white/50" />
              <Skeleton className="h-2 w-16 rounded-full bg-white/40" />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn('h-5 rounded-md', NAME_WIDTHS[i])} />
            <Skeleton variant="text" className={cn('h-2.5', DESC_WIDTHS[i])} />
            <Skeleton variant="text" className={cn('h-2.5', DESC2_WIDTHS[i])} />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-md" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Skeleton className={cn('h-4 rounded-md', USES_WIDTHS[i])} />
          <span>active profiles using this</span>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-5 dark:border-white/10">
          <Skeleton className="h-8 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

type AdminTemplatesSkeletonProps = {
  className?: string
  gridClassName?: string
  cardCount?: number
}

/** Layout-matched template card skeletons for Admin Templates loading. */
export function AdminTemplatesSkeleton({ className, gridClassName, cardCount = 3 }: AdminTemplatesSkeletonProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 xl:grid-cols-3', gridClassName, className)}
      aria-busy="true"
      aria-label="Loading templates"
    >
      {Array.from({ length: cardCount }).map((_, i) => (
        <AdminTemplateCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
