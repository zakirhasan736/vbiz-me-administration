import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'

const skeletonVariants = cva('animate-pulse bg-slate-200 dark:bg-slate-700', {
  variants: {
    variant: {
      block: 'rounded-xl',
      circle: 'rounded-full',
      text: 'h-3 rounded-md',
    },
  },
  defaultVariants: {
    variant: 'block',
  },
})

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(({ className, variant, ...props }, ref) => {
  return <div ref={ref} className={cn(skeletonVariants({ variant }), className)} {...props} />
})

Skeleton.displayName = 'Skeleton'

export { skeletonVariants }
