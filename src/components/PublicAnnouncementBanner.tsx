'use client'

import { useGetPublicProfileAnnouncementQuery } from '@/redux/features/publicAnnouncements/publicAnnouncements.api'
import type { Announcement, AnnouncementType } from '@/types/announcement'
import { cn } from '@/utils/cn'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useCallback, useSyncExternalStore } from 'react'

const DISMISS_PREFIX = 'public-announcement:'
const DISMISS_SUFFIX = ':dismissed'
const DISMISS_EVENT = 'public-announcement-dismiss'

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
    wrap: 'border-sky-200/80 bg-sky-50 text-sky-950',
    icon: 'text-sky-600',
    button: 'text-sky-700 hover:bg-sky-100/80',
    Icon: Info,
  },
  warning: {
    wrap: 'border-amber-200/80 bg-amber-50 text-amber-950',
    icon: 'text-amber-600',
    button: 'text-amber-800 hover:bg-amber-100/80',
    Icon: AlertTriangle,
  },
  success: {
    wrap: 'border-emerald-200/80 bg-emerald-50 text-emerald-950',
    icon: 'text-emerald-600',
    button: 'text-emerald-800 hover:bg-emerald-100/80',
    Icon: CheckCircle2,
  },
}

function isShowPublicBanner(value: Announcement | null | undefined): value is Announcement {
  if (!value || typeof value !== 'object') return false
  if (!value.id?.trim()) return false
  if (!value.title?.trim() && !value.body?.trim()) return false
  if (value.meta?.channel === 'inbox') return false
  if (value.meta?.showPublic !== '1') return false
  return true
}

type Props = {
  profileId: string
}

export default function PublicAnnouncementBanner({ profileId }: Props) {
  const trimmed = profileId.trim()
  const { data } = useGetPublicProfileAnnouncementQuery(trimmed, {
    skip: !trimmed,
    pollingInterval: 60_000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const banner = isShowPublicBanner(data) ? data : null
  const dismissed = useIsAnnouncementDismissed(banner?.id)

  if (!banner || dismissed) return null

  const styles = typeStyles[banner.type] ?? typeStyles.info
  const Icon = styles.Icon
  const ariaRole = banner.type === 'warning' ? 'alert' : 'status'

  return (
    <div
      role={ariaRole}
      aria-live={banner.type === 'warning' ? 'assertive' : 'polite'}
      className={cn('relative z-40 mx-3 mt-3 overflow-hidden rounded-2xl border shadow-sm sm:mx-4', styles.wrap)}
    >
      <div className="flex items-start gap-3 px-3 py-2.5 sm:items-center sm:px-4">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0 sm:mt-0', styles.icon)} aria-hidden />
        <div className="min-w-0 flex-1">
          {banner.title?.trim() ? (
            <p className="text-[10px] font-black tracking-wider uppercase opacity-70">{banner.title}</p>
          ) : null}
          <p className="mt-0.5 text-sm leading-snug font-semibold">{banner.body}</p>
        </div>
        <button
          type="button"
          onClick={() => markDismissed(banner.id)}
          className={cn('shrink-0 rounded-xl p-1.5 transition-colors', styles.button)}
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
