'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type V3SectionShellProps = {
  children: ReactNode
  className?: string
}

export function V3SectionShell({ children, className = '' }: V3SectionShellProps) {
  return <div className={`mx-auto w-full max-w-6xl px-0 pb-24 md:px-5 lg:px-6 ${className}`}>{children}</div>
}

type V3SectionHeaderProps = {
  badge: string
  badgeIcon: LucideIcon
  title: ReactNode
  subtitle?: string
  className?: string
}

function goldSplitTitle(title: ReactNode): ReactNode {
  if (typeof title !== 'string') return title
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) {
    return (
      <span className="from-gold bg-linear-to-r to-yellow-500 bg-clip-text text-transparent not-italic">{title}</span>
    )
  }
  const accentWord = words.pop()
  return (
    <>
      {words.join(' ')}{' '}
      <span className="from-gold bg-linear-to-r to-yellow-500 bg-clip-text text-transparent not-italic">
        {accentWord}
      </span>
    </>
  )
}

export function V3SectionHeader({ badge, badgeIcon: Icon, title, subtitle, className = '' }: V3SectionHeaderProps) {
  return (
    <div
      className={`vbiz-hero-banner bg-ocean-deep dark:border-gold/20 group relative mb-4 w-full overflow-hidden rounded-4xl border border-zinc-800 px-6 py-10 shadow-xl sm:px-8 sm:py-12 md:mb-4 md:rounded-[2.5rem] md:px-10 md:py-14 ${className}`}
    >
      <div className="from-ocean-deep via-ocean-deep/80 pointer-events-none absolute inset-0 bg-linear-to-br to-violet-950/40" />
      <div className="bg-gold/10 pointer-events-none absolute top-0 right-0 -mt-24 -mr-24 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />

      <div className="relative z-10">
        <div className="vbiz-hero-eyebrow vbiz-eyebrow mb-3 self-start shadow-sm backdrop-blur-md md:text-xs">
          <Icon size={14} className="text-gold" /> {badge}
        </div>
        <h2 className="vbiz-hero-title relative z-10 max-w-xl font-serif text-3xl leading-tight font-medium tracking-tight text-white italic sm:text-4xl md:text-5xl">
          {goldSplitTitle(title)}
        </h2>
        {subtitle ? (
          <p className="vbiz-hero-subtitle mt-3 max-w-2xl text-sm leading-normal font-medium text-zinc-300 md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}

type V3EmptyStateProps = {
  icon: LucideIcon
  title: string
  message: string
}

export function V3EmptyState({ icon: Icon, title, message }: V3EmptyStateProps) {
  return (
    <V3SectionShell>
      <div className="vbiz-card flex min-h-80 flex-col items-center justify-center rounded-4xl border border-dashed p-10 text-center">
        <div className="vbiz-pill-icon mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border">
          <Icon size={24} />
        </div>
        <h2 className="vbiz-title mb-3 text-2xl font-black tracking-tight">{title}</h2>
        <p className="vbiz-description max-w-md text-sm leading-relaxed font-medium">{message}</p>
      </div>
    </V3SectionShell>
  )
}

type V3ErrorStateProps = {
  sectionTitle: string
}

export function V3ErrorState({ sectionTitle }: V3ErrorStateProps) {
  return (
    <V3SectionShell>
      <div className="rounded-4xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        Unable to load {sectionTitle.toLowerCase()} right now. Please try again later.
      </div>
    </V3SectionShell>
  )
}

type V3LoadingSkeletonProps = {
  className?: string
}

export function V3LoadingSkeleton({ className = 'min-h-90' }: V3LoadingSkeletonProps) {
  return (
    <V3SectionShell>
      <div
        className={`animate-pulse rounded-4xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800 ${className}`}
      />
    </V3SectionShell>
  )
}
