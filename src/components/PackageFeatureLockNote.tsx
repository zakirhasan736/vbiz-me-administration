import { PACKAGE_FEATURE_LOCKED_MESSAGE } from '@/lib/packageAccess'
import { cn } from '@/utils/cn'

export function PackageFeatureLockNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs font-semibold text-slate-500 dark:text-slate-400', className)}>
      {PACKAGE_FEATURE_LOCKED_MESSAGE}
    </p>
  )
}
