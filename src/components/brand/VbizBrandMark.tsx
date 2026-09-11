import { cn } from '@/utils/cn'
import Image from 'next/image'

export const VBIZ_LOGO_PATH = '/logo-vbizme.webp'
/** Default browser-tab / apple-touch icon when a card has no custom favicon. */
export const VBIZ_DEFAULT_FAVICON_PATH = '/icon-vbizme-192.png'
export const VBIZ_FAVICON_32_PATH = '/favicon-32.png'
export const VBIZ_APPLE_TOUCH_ICON_PATH = '/apple-touch-icon.png'

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
