'use client'

import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Skeleton } from '@/components/ui/Skeleton'
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
    return <Skeleton aria-hidden as="span" className={cn('inline-block h-8 w-20', skeletonClassName)} />
  }

  if (live) {
    return <AnimatedNumber value={value} className={className} />
  }

  return <span className={cn('tabular-nums', className)}>{value.toLocaleString()}</span>
}

export default StatNumber
