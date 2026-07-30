'use client'

import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react'

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded border border-slate-300 bg-white text-primary-600 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-slate-800 dark:checked:border-primary-500',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> &
  VariantProps<typeof checkboxVariants> & {
    indeterminate?: boolean
    label?: ReactNode
    containerClassName?: string
  }

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, containerClassName, size, indeterminate = false, label, id, ...props }, ref) => {
    const localRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      const el = localRef.current
      if (el) el.indeterminate = indeterminate
    }, [indeterminate])

    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-slate-200',
          props.disabled && 'cursor-not-allowed opacity-60',
          containerClassName
        )}
      >
        <input
          ref={(node) => {
            localRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          id={id}
          type="checkbox"
          className={cn(checkboxVariants({ size }), className)}
          {...props}
        />
        {label ? <span>{label}</span> : null}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { checkboxVariants }
