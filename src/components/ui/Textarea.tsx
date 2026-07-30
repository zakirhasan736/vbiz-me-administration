import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

const textareaVariants = cva(
  'w-full resize-y border bg-slate-50 font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:bg-slate-800 dark:text-white disabled:cursor-not-allowed disabled:opacity-60',
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

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & VariantProps<typeof textareaVariants>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, invalid = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(textareaVariants({ size, invalid }), className)}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { textareaVariants }
