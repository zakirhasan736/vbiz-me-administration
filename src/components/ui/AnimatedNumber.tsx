'use client'

import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { cn } from '@/utils/cn'

type AnimatedNumberProps = {
  value: number | null | undefined
  className?: string
  durationMs?: number
  format?: (n: number) => string
}

const defaultFormat = (n: number) => n.toLocaleString()

export function AnimatedNumber({ value, className, durationMs, format = defaultFormat }: AnimatedNumberProps) {
  const display = useAnimatedNumber(value, { durationMs })
  return <span className={cn('tabular-nums', className)}>{format(display)}</span>
}

export default AnimatedNumber
