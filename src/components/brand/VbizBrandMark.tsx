import { cn } from '@/utils/cn'
import Image from 'next/image'

export const VBIZ_LOGO_PATH = '/logo-vbizme.webp'

type VbizBrandMarkProps = {
  size?: number
  className?: string
  priority?: boolean
}

/** Shared vBiz logo used in backoffice chrome and browser favicon metadata. */
export function VbizBrandMark({ size = 32, className, priority = false }: VbizBrandMarkProps) {
  return (
    <Image
      src={VBIZ_LOGO_PATH}
      alt="vBiz Me"
      width={size}
      height={size}
      priority={priority}
      className={cn('rounded-xl object-contain', className)}
    />
  )
}
