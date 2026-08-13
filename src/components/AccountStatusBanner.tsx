'use client'

import { useAccountStatus } from '@/hooks/useAccountStatus'
import { ACCOUNT_PAUSED_CREATE_MESSAGE, ACCOUNT_SUSPENDED_MESSAGE } from '@/lib/accountStatus'
import { cn } from '@/utils/cn'
import { AlertTriangle, Ban, Lock } from 'lucide-react'

export function AccountStatusBanner() {
  const { isPaused, isSuspended } = useAccountStatus()

  if (!isPaused && !isSuspended) return null

  const suspended = isSuspended
  const message = suspended ? ACCOUNT_SUSPENDED_MESSAGE : ACCOUNT_PAUSED_CREATE_MESSAGE
  const title = suspended ? 'Account suspended — all actions disabled' : 'Account paused — vCards locked'

  return (
    <div
      role="status"
      className={cn(
        'mx-4 mt-3 rounded-2xl border px-4 py-3.5 md:mx-8 lg:mx-auto lg:max-w-7xl',
        suspended
          ? 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-50'
          : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50'
      )}
    >
      <div className="flex items-start gap-3">
        {suspended ? (
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black tracking-tight">{title}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase',
                suspended
                  ? 'bg-rose-600/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-100'
                  : 'bg-amber-600/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-100'
              )}
            >
              <Lock className="h-3 w-3" />
              {suspended ? 'Locked' : 'Limited'}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium opacity-95">{message}</p>
          {suspended ? (
            <p className="mt-1.5 text-xs font-semibold opacity-80">
              The dashboard below is disabled. Use the profile menu to log out.
            </p>
          ) : (
            <p className="mt-1.5 text-xs font-semibold opacity-80">
              Account settings and password changes still work. Creating or editing vCards does not.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
