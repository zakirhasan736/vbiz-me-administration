'use client'

import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

const switchVariants = cva(
  'relative inline-flex shrink-0 items-center rounded-full shadow-inner transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-7 w-12',
        lg: 'h-8 w-14',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const thumbVariants = cva('inline-block transform rounded-full bg-white shadow-sm transition-transform duration-300', {
  variants: {
    size: {
      sm: 'h-3.5 w-3.5',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
    checked: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    { size: 'sm', checked: true, class: 'translate-x-4' },
    { size: 'sm', checked: false, class: 'translate-x-0.5' },
    { size: 'md', checked: true, class: 'translate-x-5.5' },
    { size: 'md', checked: false, class: 'translate-x-1' },
    { size: 'lg', checked: true, class: 'translate-x-7' },
    { size: 'lg', checked: false, class: 'translate-x-1' },
  ],
  defaultVariants: {
    size: 'md',
    checked: false,
  },
})

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> &
  VariantProps<typeof switchVariants> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    onChange?: () => void
  }

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, size, checked = false, onCheckedChange, onChange, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => {
          onChange?.()
          onCheckedChange?.(!checked)
        }}
        className={cn(
          switchVariants({ size }),
          checked ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700',
          className
        )}
        {...props}
      >
        <span className={cn(thumbVariants({ size, checked }))} />
      </button>
    )
  }
)

Switch.displayName = 'Switch'

export { switchVariants }
