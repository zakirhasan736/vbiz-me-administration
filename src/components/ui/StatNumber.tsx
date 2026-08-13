'use client'

import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { cn } from '@/utils/cn'

type StatNumberProps = {
  value: number | null | undefined
  loading?: boolean
  live?: boolean
  className?: string
  skeletonClassName?: string
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function StatNumber({ value, loading, live, className, skeletonClassName }: StatNumberProps) {
  if (loading || !isFiniteNumber(value)) {
    return (
      <span
        aria-hidden
        className={cn(
          'inline-block h-8 w-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700',
          skeletonClassName
        )}
      />
    )
  }

  if (live) {
    return <AnimatedNumber value={value} className={className} />
  }

  return <span className={cn('tabular-nums', className)}>{value.toLocaleString()}</span>
}

export default StatNumber
