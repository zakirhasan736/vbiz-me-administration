'use client'

import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { isTourCompleted, type TourKey } from '@/lib/dashboardTour'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/utils/cn'
import { Compass, Sparkles } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

type TakeTourBannerProps = {
  variant?: 'banner' | 'compact'
  className?: string
  onStart?: () => void
  title?: string
  body?: string
  tourKey?: TourKey
  /** When false, hide while tour incomplete (auto-start owns first run). Default true = always show for replay. */
  alwaysShow?: boolean
}

export function TakeTourTrigger({
  className,
  onStart,
  tourKey = 'dashboard',
}: Pick<TakeTourBannerProps, 'className' | 'onStart' | 'tourKey'>) {
  const { user, loading } = useAuth()
  const role = useAppSelector((state) => state.user.user?.role)
  const { startTour, isActive } = useDashboardTour()
  const pathname = usePathname()
  const router = useRouter()

  if (loading || !user?.uid || isActive) return null
  if (tourKey === 'dashboard' && role !== 'vcard-owner') return null

  return (
    <button
      type="button"
      onClick={() => {
        if (tourKey === 'dashboard' && pathname !== '/') {
          router.push('/')
        }
        startTour(tourKey)
        onStart?.()
      }}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 text-[13px] leading-none font-semibold whitespace-nowrap text-indigo-700 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/15 active:scale-[0.98] dark:border-indigo-400/25 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/15',
        className
      )}
    >
      <Compass className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span className="truncate">Take a tour</span>
    </button>
  )
}

export function TakeTourBanner({
  variant = 'banner',
  className,
  onStart,
  title = 'Take a dashboard tour',
  body = 'New to vBiz? Walk through overview metrics and actions — you can start this anytime.',
  tourKey = 'dashboard',
  alwaysShow = true,
}: TakeTourBannerProps) {
  const { user, loading } = useAuth()
  const role = useAppSelector((state) => state.user.user?.role)
  const { startTour, isActive, activeTourKey } = useDashboardTour()

  const handleStart = () => {
    startTour(tourKey)
    onStart?.()
  }

  if (loading || !user?.uid || isActive) return null
  if (tourKey === 'dashboard' && role !== 'vcard-owner') return null
  if (!alwaysShow && !isTourCompleted(tourKey, user.uid)) return null
  // Hide invite while the matching tour key is active (already gated by isActive)

  if (variant === 'compact') {
    return <TakeTourTrigger className={className} onStart={onStart} tourKey={tourKey} />
  }

  return (
    <div
      className={cn(
        'relative mb-6 flex flex-col gap-4 rounded-2xl border border-indigo-200/70 bg-linear-to-r from-indigo-50/90 to-violet-50/60 p-4 sm:flex-row sm:items-center sm:p-5 dark:border-indigo-500/25 dark:from-indigo-500/10 dark:to-violet-500/5',
        className
      )}
      role="region"
      aria-label="Guided tour"
      data-tour-invite={tourKey}
      data-active-tour={activeTourKey ?? undefined}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
          <Compass className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-black text-slate-900 dark:text-white">{title}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed font-semibold text-slate-500 dark:text-slate-400">{body}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleStart}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:flex-none"
      >
        <Sparkles className="h-4 w-4" /> Start tour
      </button>
    </div>
  )
}
