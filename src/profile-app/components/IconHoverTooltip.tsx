'use client'

import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

const PLACEMENT_CLASS = {
  left: 'top-1/2 right-full mr-2 -translate-y-1/2',
  right: 'top-1/2 left-full ml-2 -translate-y-1/2',
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
} as const

export type IconHoverTooltipPlacement = keyof typeof PLACEMENT_CLASS

type IconHoverTooltipProps = {
  label: string
  children: ReactNode
  placement?: IconHoverTooltipPlacement
  className?: string
}

/** Hover chip matching certifications “See full size” tooltip. */
export function IconHoverTooltip({ label, children, placement = 'top', className }: IconHoverTooltipProps) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 rounded-lg border border-zinc-200 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover/tip:opacity-100 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900',
          PLACEMENT_CLASS[placement]
        )}
      >
        {label}
      </span>
    </span>
  )
}
