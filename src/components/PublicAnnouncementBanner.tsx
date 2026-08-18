'use client'

import { useCardScopeId } from '@/lib/card-scope'
import { getOrCreateGuestId } from '@/profile-app/lib/guestId'
import { useProfileNavigation } from '@/profile-app/providers/ProfileNavigationProvider'
import {
  useDismissPublicProfileAnnouncementMutation,
  useGetPublicProfileAnnouncementQuery,
} from '@/redux/features/publicAnnouncements/publicAnnouncements.api'
import type { Announcement, AnnouncementType } from '@/types/announcement'
import { cn } from '@/utils/cn'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info, X } from 'lucide-react'
import { useMemo, useState } from 'react'

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
  /** Prefer explicit id; falls back to CardScopeProvider. */
  profileId?: string
  /** chrome = under nav pill; mobileTop = fixed top strip on small screens. */
  placement?: 'chrome' | 'mobileTop'
  className?: string
}

export default function PublicAnnouncementBanner({ profileId, placement = 'chrome', className }: Props) {
  const scopeId = useCardScopeId()
  const { activeSectionId } = useProfileNavigation()
  const trimmed = String(profileId ?? scopeId ?? '').trim()
  const visitorId = useMemo(() => getOrCreateGuestId(), [])
  const [dismissAnnouncement] = useDismissPublicProfileAnnouncementMutation()
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const { data, isFetching } = useGetPublicProfileAnnouncementQuery(
    { profileId: trimmed, visitorId },
    {
      skip: !trimmed || activeSectionId !== 'home',
      pollingInterval: 60_000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  )

  const banner = isShowPublicBanner(data) ? data : null
  const isDismissed = Boolean(banner?.id && dismissedId === banner.id)
  const isLongBody = (banner?.body?.trim().length ?? 0) > 140

  if (activeSectionId !== 'home') return null
  if (!banner || isDismissed) return null
  if (isFetching && !banner) return null

  const handleDismiss = async () => {
    if (!banner) return
    setDismissedId(banner.id)
    try {
      await dismissAnnouncement({ profileId: trimmed, announcementId: banner.id, visitorId }).unwrap()
    } catch {
      setDismissedId(null)
    }
  }

  const bodyClassName = expanded || !isLongBody ? '' : 'line-clamp-2'

  const styles = typeStyles[banner.type] ?? typeStyles.info
  const Icon = styles.Icon
  const ariaRole = banner.type === 'warning' ? 'alert' : 'status'

  return (
    <div
      data-public-announcement=""
      data-placement={placement}
      role={ariaRole}
      aria-live={banner.type === 'warning' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto w-full overflow-hidden rounded-[22px] border shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl',
        styles.wrap,
        placement === 'mobileTop' && 'rounded-2xl',
        className
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70">
          <Icon className={cn('h-4 w-4', styles.icon)} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {banner.title?.trim() ? (
            <p className="text-[10px] font-black tracking-[0.18em] uppercase opacity-70">{banner.title}</p>
          ) : null}
          <p className={cn('mt-1 text-sm leading-6 font-semibold whitespace-pre-wrap', bodyClassName)}>{banner.body}</p>
          {isLongBody ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black',
                styles.button
              )}
            >
              {expanded ? 'Read less' : 'Read more'}
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void handleDismiss()}
          className={cn('shrink-0 rounded-xl p-1.5 transition-colors', styles.button)}
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
