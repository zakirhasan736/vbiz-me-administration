import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2, type LucideIcon } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:ring-offset-slate-900',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:scale-95 dark:bg-primary-600 dark:hover:bg-primary-500',
        secondary:
          'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
        dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
        ghost:
          'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
        danger:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-95 dark:bg-red-600 dark:hover:bg-red-500',
        outline:
          'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 active:scale-95 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5',
      },
      size: {
        sm: 'h-9 rounded-xl px-3 text-[12px]',
        md: 'h-11 rounded-[14px] px-4 text-[13px]',
        lg: 'h-12 rounded-2xl px-5 text-[14px]',
        icon: 'h-10 w-10 rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    leftIcon?: LucideIcon
    rightIcon?: LucideIcon
    children?: ReactNode
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : LeftIcon ? (
          <LeftIcon className="h-4 w-4 shrink-0" />
        ) : null}
        {children}
        {!loading && RightIcon ? <RightIcon className="h-4 w-4 shrink-0" /> : null}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }
