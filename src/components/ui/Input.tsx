'use client'

import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'

const inputVariants = cva(
  'w-full border bg-slate-50 font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'rounded-xl px-3 py-2 text-[12px]',
        md: 'rounded-[14px] px-4 py-3.5 text-[13px]',
        lg: 'rounded-2xl px-5 py-4 text-[14px]',
      },
      invalid: {
        true: 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60 dark:bg-red-500/10',
        false: 'border-slate-200 focus:border-primary-500 focus:ring-primary-500 dark:border-white/10',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  }
)

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  VariantProps<typeof inputVariants> & {
    leftIcon?: LucideIcon
    rightSlot?: ReactNode
    containerClassName?: string
  }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, containerClassName, size, invalid = false, leftIcon: LeftIcon, rightSlot, type = 'text', ...props },
    ref
  ) => {
    const [visible, setVisible] = useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword ? (visible ? 'text' : 'password') : type

    const paddingLeft = LeftIcon ? (size === 'sm' ? 'pl-9' : size === 'lg' ? 'pl-12' : 'pl-11') : undefined

    const paddingRight =
      isPassword || rightSlot ? (size === 'sm' ? 'pr-9' : size === 'lg' ? 'pr-12' : 'pr-11') : undefined

    return (
      <div className={cn('relative w-full', containerClassName)}>
        {LeftIcon ? (
          <LeftIcon
            className={cn(
              'pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 transition-colors',
              invalid ? 'text-red-500' : 'group-focus-within:text-primary-600 text-slate-400 dark:text-slate-500'
            )}
          />
        ) : null}
        <input
          ref={ref}
          type={resolvedType}
          aria-invalid={invalid || undefined}
          className={cn(inputVariants({ size, invalid }), paddingLeft, paddingRight, className)}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : rightSlot ? (
          <div className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2">{rightSlot}</div>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { inputVariants }
