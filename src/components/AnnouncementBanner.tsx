'use client'

import { useGetActiveAnnouncementQuery } from '@/redux/features/adminAnnouncements/adminAnnouncements.api'
import type { AnnouncementType } from '@/types/announcement'
import { cn } from '@/utils/cn'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useCallback, useSyncExternalStore } from 'react'

const DISMISS_PREFIX = 'announcement:'
const DISMISS_SUFFIX = ':dismissed'
const DISMISS_EVENT = 'announcement-dismiss'

function dismissKey(id: string) {
  return `${DISMISS_PREFIX}${id}${DISMISS_SUFFIX}`
}

function isDismissed(id: string): boolean {
  try {
    return localStorage.getItem(dismissKey(id)) === '1'
  } catch {
    return false
  }
}

function markDismissed(id: string) {
  try {
    localStorage.setItem(dismissKey(id), '1')
    window.dispatchEvent(new Event(DISMISS_EVENT))
  } catch {
    /* ignore quota / private mode */
  }
}

function subscribeDismissals(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(DISMISS_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(DISMISS_EVENT, onStoreChange)
  }
}

function useIsAnnouncementDismissed(id: string | undefined): boolean {
  const getSnapshot = useCallback(() => (id ? isDismissed(id) : false), [id])
  return useSyncExternalStore(subscribeDismissals, getSnapshot, () => false)
}

const typeStyles: Record<AnnouncementType, { wrap: string; icon: string; button: string; Icon: typeof Info }> = {
  info: {
    wrap: 'border-sky-200/80 bg-sky-50 text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-50',
    icon: 'text-sky-600 dark:text-sky-300',
    button: 'text-sky-700 hover:bg-sky-100/80 dark:text-sky-200 dark:hover:bg-sky-500/20',
    Icon: Info,
  },
  warning: {
    wrap: 'border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-50',
    icon: 'text-amber-600 dark:text-amber-300',
    button: 'text-amber-800 hover:bg-amber-100/80 dark:text-amber-100 dark:hover:bg-amber-500/20',
    Icon: AlertTriangle,
  },
  success: {
    wrap: 'border-emerald-200/80 bg-emerald-50 text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-50',
    icon: 'text-emerald-600 dark:text-emerald-300',
    button: 'text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-100 dark:hover:bg-emerald-500/20',
    Icon: CheckCircle2,
  },
}

type AnnouncementBannerProps = {
  enabled?: boolean
}

export default function AnnouncementBanner({ enabled = true }: AnnouncementBannerProps) {
  const { data: announcement } = useGetActiveAnnouncementQuery(undefined, {
    skip: !enabled,
    pollingInterval: 60_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const dismissed = useIsAnnouncementDismissed(announcement?.id)

  if (!enabled || !announcement || dismissed) {
    return null
  }

  const styles = typeStyles[announcement.type] ?? typeStyles.info
  const Icon = styles.Icon
  const role = announcement.type === 'warning' ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-live={announcement.type === 'warning' ? 'assertive' : 'polite'}
      className={cn(
        'relative z-40 mx-4 mt-4 overflow-hidden rounded-2xl border shadow-sm md:mx-8 lg:mx-auto lg:max-w-7xl',
        styles.wrap
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3 sm:items-center sm:px-5">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0 sm:mt-0', styles.icon)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-wider uppercase opacity-70">{announcement.title}</p>
          <p className="mt-0.5 text-sm leading-snug font-semibold sm:text-[15px]">{announcement.body}</p>
        </div>
        <button
          type="button"
          onClick={() => markDismissed(announcement.id)}
          className={cn('shrink-0 rounded-xl p-1.5 transition-colors', styles.button)}
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
