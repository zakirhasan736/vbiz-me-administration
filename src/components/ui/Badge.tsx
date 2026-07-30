import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'

const badgeVariants = cva('inline-flex items-center justify-center gap-1 font-semibold whitespace-nowrap', {
  variants: {
    variant: {
      default: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
      primary: 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300',
      success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
      danger: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
      outline: 'border border-slate-200 bg-transparent text-slate-600 dark:border-white/10 dark:text-slate-300',
    },
    size: {
      sm: 'rounded-md px-1.5 py-0.5 text-[10px]',
      md: 'rounded-lg px-2 py-0.5 text-[11px]',
      lg: 'rounded-xl px-2.5 py-1 text-[12px]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, size, ...props }, ref) => {
  return <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
})

Badge.displayName = 'Badge'

export { badgeVariants }
