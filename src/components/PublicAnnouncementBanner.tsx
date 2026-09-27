'use client'

import type { MyCardTeamNotice } from '@/interfaces/api/myCard'
import { useCardScopeId } from '@/lib/card-scope'
import { getOrCreateGuestId } from '@/profile-app/lib/guestId'
import { useProfileNavigation } from '@/profile-app/providers/ProfileNavigationProvider'
import {
  useDismissPublicProfileAnnouncementMutation,
  useDismissPublicProfileTeamNoticeMutation,
  useGetPublicProfileAnnouncementQuery,
  useGetPublicProfileTeamNoticeQuery,
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
  if (value.targetType !== 'all') return false
  if (value.meta?.source === 'card_notice') return false
  return true
}

function teamNoticeType(value: MyCardTeamNotice['type']): AnnouncementType {
  if (value === 'warning' || value === 'system') return 'warning'
  if (value === 'success') return 'success'
  return 'info'
}

function bannerFromTeamNotice(value: MyCardTeamNotice | null | undefined): Announcement | null {
  if (!value?.id?.trim()) return null
  const body = value.text?.trim()
  if (!body) return null
  const type = teamNoticeType(value.type)
  return {
    id: value.id,
    kind: type === 'warning' ? 'warning' : 'announcement',
    type,
    title: '',
    body,
    status: 'active',
    targetType: 'specific',
    targetEmails: [],
    startsAt: null,
    endsAt: null,
    meta: { showPublic: '1', source: 'card_notice' },
    createdAt: value.createdAt,
    updatedAt: value.createdAt,
  }
}

type BannerStripProps = {
  banner: Announcement
  placement: 'chrome' | 'mobileTop'
  className?: string
  onDismiss: () => void
}

function BannerStrip({ banner, placement, className, onDismiss }: BannerStripProps) {
  const [expanded, setExpanded] = useState(false)
  const isLongBody = (banner.body?.trim().length ?? 0) > 140
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
        'pointer-events-auto w-full overflow-hidden rounded-[22px] border shadow-[0_14px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl',
        styles.wrap,
        placement === 'mobileTop' && 'rounded-2xl',
        className
      )}
    >
      <div className="flex items-start gap-2 px-3 py-2 sm:px-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70">
          <Icon className={cn('h-4 w-4', styles.icon)} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {banner.title?.trim() ? (
            <p className="text-[10px] font-black tracking-[0.18em] uppercase opacity-70">{banner.title}</p>
          ) : null}
          <p className={cn('mt-1 text-sm leading-[1.2] font-semibold whitespace-pre-wrap', bodyClassName)}>
            {banner.body}
          </p>
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
          onClick={onDismiss}
          className={cn('shrink-0 rounded-xl p-1.5 transition-colors', styles.button)}
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
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
  const [dismissTeamNotice] = useDismissPublicProfileTeamNoticeMutation()
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const skip = !trimmed || activeSectionId !== 'home'
  const queryOpts = {
    skip,
    pollingInterval: 120_000,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  }
  const { data, isFetching } = useGetPublicProfileAnnouncementQuery({ profileId: trimmed, visitorId }, queryOpts)
  const { data: teamNotice, isFetching: isFetchingNotice } = useGetPublicProfileTeamNoticeQuery(
    { profileId: trimmed, visitorId, origin: 'admin' },
    queryOpts
  )

  const cardNoticeBanner = bannerFromTeamNotice(teamNotice)
  const globalBanner = isShowPublicBanner(data) ? data : null
  const visibleGlobal = globalBanner && !dismissedIds.includes(globalBanner.id) ? globalBanner : null
  const visibleCard = cardNoticeBanner && !dismissedIds.includes(cardNoticeBanner.id) ? cardNoticeBanner : null

  if (activeSectionId !== 'home') return null
  if ((isFetching || isFetchingNotice) && !visibleGlobal && !visibleCard) return null
  if (!visibleGlobal && !visibleCard) return null

  const dismiss = async (banner: Announcement, source: 'team_notice' | 'announcement') => {
    setDismissedIds((ids) => (ids.includes(banner.id) ? ids : [...ids, banner.id]))
    try {
      if (source === 'team_notice') {
        await dismissTeamNotice({ profileId: trimmed, noticeId: banner.id, visitorId }).unwrap()
      } else {
        await dismissAnnouncement({ profileId: trimmed, announcementId: banner.id, visitorId }).unwrap()
      }
    } catch {
      setDismissedIds((ids) => ids.filter((id) => id !== banner.id))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {visibleGlobal ? (
        <BannerStrip
          banner={visibleGlobal}
          placement={placement}
          className={className}
          onDismiss={() => void dismiss(visibleGlobal, 'announcement')}
        />
      ) : null}
      {visibleCard ? (
        <BannerStrip
          banner={visibleCard}
          placement={placement}
          className={className}
          onDismiss={() => void dismiss(visibleCard, 'team_notice')}
        />
      ) : null}
    </div>
  )
}
