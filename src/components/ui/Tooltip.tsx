'use client'

import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { useId, useState, type HTMLAttributes, type ReactNode } from 'react'

const tooltipVariants = cva(
  'pointer-events-none absolute z-50 max-w-xs rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-white shadow-lg dark:bg-slate-100 dark:text-slate-900',
  {
    variants: {
      side: {
        top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
        bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
        left: 'top-1/2 right-full mr-2 -translate-y-1/2',
        right: 'top-1/2 left-full ml-2 -translate-y-1/2',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  }
)

export type TooltipProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof tooltipVariants> & {
    content: ReactNode
    children: ReactNode
  }

export function Tooltip({ content, children, side = 'top', className, ...props }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span id={id} role="tooltip" className={cn(tooltipVariants({ side }))}>
          {content}
        </span>
      ) : null}
    </span>
  )
}

export { tooltipVariants }
