'use client'

import { useAuth } from '@/components/auth/Auth'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { dismissTourBanner, isTourBannerDismissed, isTourCompleted } from '@/lib/dashboardTour'
import { cn } from '@/utils/cn'
import { Compass, PlayCircle, X } from 'lucide-react'
import { useCallback, useState } from 'react'

type TakeTourBannerProps = {
  variant?: 'banner' | 'compact'
  className?: string
  onStart?: () => void
}

export function TakeTourTrigger({ className, onStart }: Pick<TakeTourBannerProps, 'className' | 'onStart'>) {
  const { user, loading } = useAuth()
  const { startTour, isActive } = useDashboardTour()

  if (loading || !user?.uid || isActive || !isTourCompleted(user.uid)) {
    return null
  }

  return (
    <button
      type="button"
      onClick={() => {
        startTour()
        onStart?.()
      }}
      className={cn(
        'border-primary-500/25 bg-primary-500/10 text-primary-700 hover:border-primary-500/40 hover:bg-primary-500/15 dark:border-primary-400/25 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:border-primary-400/40 dark:hover:bg-primary-500/15 inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[13px] leading-none font-semibold whitespace-nowrap transition-all active:scale-[0.98]',
        className
      )}
    >
      <Compass className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span className="truncate">Take a tour</span>
    </button>
  )
}

export function TakeTourBanner({ variant = 'banner', className, onStart }: TakeTourBannerProps) {
  const { user, loading } = useAuth()
  const { startTour, isActive } = useDashboardTour()
  const uid = user?.uid
  const storedDismissed = uid ? isTourBannerDismissed(uid) : true
  const [sessionDismissed, setSessionDismissed] = useState(false)
  const bannerDismissed = storedDismissed || sessionDismissed

  const handleStart = useCallback(() => {
    startTour()
    onStart?.()
  }, [startTour, onStart])

  const handleDismiss = useCallback(() => {
    if (!uid) return
    dismissTourBanner(uid)
    setSessionDismissed(true)
  }, [uid])

  if (loading || !uid || isActive || !isTourCompleted(uid)) {
    return null
  }

  if (variant === 'compact') {
    return <TakeTourTrigger className={className} onStart={onStart} />
  }

  if (bannerDismissed) {
    return null
  }

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-top-2 border-primary-500/20 from-primary-500/8 dark:border-primary-400/20 dark:from-primary-500/10 relative mb-6 overflow-hidden rounded-2xl border bg-linear-to-r via-indigo-500/6 to-violet-500/8 shadow-sm duration-500 dark:via-indigo-500/10 dark:to-violet-500/10',
        className
      )}
      role="region"
      aria-label="Guided tour"
    >
      <div
        aria-hidden
        className="bg-primary-500/20 dark:bg-primary-400/15 pointer-events-none absolute -top-12 -right-8 h-32 w-32 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-400/10"
      />

      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
          <div className="bg-primary-600 dark:bg-primary-500 shadow-primary-600/25 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md">
            <Compass className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              Need a refresher on vbiz.me?
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">
              Revisit the guided walkthrough anytime to explore vCards, templates, and account settings.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pl-4">
          <button
            type="button"
            onClick={handleStart}
            className="bg-primary-600 hover:bg-primary-700 inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] sm:flex-none"
          >
            <PlayCircle className="h-4 w-4" strokeWidth={2.25} />
            Take a tour
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
            aria-label="Dismiss tour banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
