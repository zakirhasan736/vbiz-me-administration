'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { Layers, Users } from 'lucide-react'

const NAME_WIDTHS = ['w-32', 'w-40', 'w-28'] as const
const DESC_WIDTHS = ['w-5/6', 'w-4/5', 'w-11/12'] as const
const PRICE_WIDTHS = ['w-24', 'w-28', 'w-20'] as const
const SUB_WIDTHS = ['w-20', 'w-24', 'w-16'] as const
const META_NUM_WIDTHS = ['w-6', 'w-8', 'w-5'] as const
const FACILITY_WIDTHS = [
  ['w-4/5', 'w-3/4', 'w-5/6', 'w-2/3'],
  ['w-3/4', 'w-5/6', 'w-2/3', 'w-4/5'],
  ['w-5/6', 'w-2/3', 'w-4/5', 'w-3/4'],
] as const

/** Structured placeholder matching AdminPackages card layout. */
export function AdminPackageCardSkeleton({ index = 0, className }: { index?: number; className?: string }) {
  const i = index % NAME_WIDTHS.length
  const facilityWidths = FACILITY_WIDTHS[i]

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-4xl border border-slate-200/80 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
        className
      )}
      aria-hidden
    >
      <div>
        <div className="mb-5 flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            <Skeleton className={cn('h-3 rounded-md', SUB_WIDTHS[i])} />
          </div>
        </div>

        <Skeleton className={cn('h-6 rounded-md', NAME_WIDTHS[i])} />
        <Skeleton variant="text" className={cn('mt-2 h-2.5', DESC_WIDTHS[i])} />

        <div className="mt-5 mb-5 flex flex-wrap items-baseline gap-4">
          <div className="flex items-baseline gap-2">
            <Skeleton className={cn('h-8 rounded-md', PRICE_WIDTHS[i])} />
            <span className="text-sm font-bold text-slate-400"> / mo</span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
            <Users className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            <Skeleton className={cn('h-3 rounded-md', META_NUM_WIDTHS[i])} />
            <span>subscribers</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
            <Layers className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            <Skeleton className={cn('h-3 rounded-md', META_NUM_WIDTHS[(i + 1) % META_NUM_WIDTHS.length])} />
            <span>facilities</span>
          </span>
        </div>

        <div className="my-4 h-px bg-slate-100 dark:bg-white/5" />

        <div className="mb-6 space-y-2">
          <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">Facilities</p>
          {facilityWidths.map((width, row) => (
            <div key={row} className="flex items-start gap-2.5">
              <Skeleton variant="circle" className="mt-0.5 h-4 w-4 shrink-0" />
              <Skeleton variant="text" className={cn('h-3 flex-1', width)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 border-t border-slate-100 pt-5 dark:border-white/5">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-14 shrink-0 rounded-2xl" />
      </div>
    </div>
  )
}

type AdminPackagesSkeletonProps = {
  className?: string
  gridClassName?: string
  cardCount?: number
}

/** Layout-matched package card skeletons for Admin Packages loading. */
export function AdminPackagesSkeleton({ className, gridClassName, cardCount = 3 }: AdminPackagesSkeletonProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3', gridClassName, className)}
      aria-busy="true"
      aria-label="Loading packages"
    >
      {Array.from({ length: cardCount }).map((_, i) => (
        <AdminPackageCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
