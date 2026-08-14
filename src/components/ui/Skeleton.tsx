import { cn } from '@/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'

const skeletonVariants = cva('skeleton', {
  variants: {
    variant: {
      block: 'rounded-xl',
      circle: 'rounded-full',
      text: 'h-3 rounded-md',
      shimmerText: 'skeleton-text',
    },
  },
  defaultVariants: {
    variant: 'block',
  },
})

export type SkeletonProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof skeletonVariants> & {
    as?: 'div' | 'span'
  }

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, as, children, ...props }, ref) => {
    const isShimmerText = variant === 'shimmerText'
    const Component = as ?? (isShimmerText ? 'span' : 'div')

    return (
      <Component ref={ref as never} className={cn(skeletonVariants({ variant }), className)} {...props}>
        {children}
      </Component>
    )
  }
)

Skeleton.displayName = 'Skeleton'

export { skeletonVariants }
