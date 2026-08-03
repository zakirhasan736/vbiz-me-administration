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

export function V3SectionHeader({ badge, badgeIcon: Icon, title, subtitle, className = '' }: V3SectionHeaderProps) {
  return (
    <div
      className={`vbiz-section-banner group relative mb-4 w-full overflow-hidden rounded-4xl border p-5 shadow-sm md:mb-4 md:rounded-[2.5rem] md:p-6 lg:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
      <div className="bg-gold/10 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />

      <div className="relative z-10">
        <div className="vbiz-eyebrow mb-2 self-start shadow-sm backdrop-blur-md md:mb-3 md:text-xs">
          <Icon size={14} /> {badge}
        </div>
        <h2 className="vbiz-title mb-2 text-2xl leading-[1.15] font-black tracking-tight sm:text-4xl md:mb-2 lg:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="vbiz-description max-w-2xl text-sm leading-normal font-medium md:text-base">{subtitle}</p>
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
      <div className="vbiz-card flex min-h-[320px] flex-col items-center justify-center rounded-4xl border border-dashed p-10 text-center">
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

export function V3LoadingSkeleton({ className = 'min-h-[360px]' }: V3LoadingSkeletonProps) {
  return (
    <V3SectionShell>
      <div
        className={`animate-pulse rounded-4xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800 ${className}`}
      />
    </V3SectionShell>
  )
}
