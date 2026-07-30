import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { forwardRef, type SelectHTMLAttributes } from 'react'

const selectVariants = cva(
  'w-full appearance-none border bg-slate-50 font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'rounded-xl py-2 pr-9 pl-3 text-[12px]',
        md: 'rounded-[14px] py-3.5 pr-11 pl-4 text-[13px]',
        lg: 'rounded-2xl py-4 pr-12 pl-5 text-[14px]',
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

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> &
  VariantProps<typeof selectVariants> & {
    containerClassName?: string
    leftIcon?: LucideIcon
  }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, size, invalid = false, leftIcon: LeftIcon, children, ...props }, ref) => {
    const paddingLeft = LeftIcon ? (size === 'sm' ? 'pl-9' : size === 'lg' ? 'pl-12' : 'pl-11') : undefined

    return (
      <div className={cn('relative w-full', containerClassName)}>
        {LeftIcon ? (
          <LeftIcon
            className={cn(
              'pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2',
              invalid ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'
            )}
          />
        ) : null}
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(selectVariants({ size, invalid }), paddingLeft, className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      </div>
    )
  }
)

Select.displayName = 'Select'

export { selectVariants }
