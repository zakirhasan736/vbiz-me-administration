'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const PREVIEW_EMPTY_MESSAGE = 'Nothing to preview yet. Add content in the editor to see it here.'

type V3SectionShellProps = {
  children: ReactNode
  className?: string
}

export function V3SectionShell({ children, className = '' }: V3SectionShellProps) {
  return <div className={`mx-auto w-full max-w-6xl px-0 pb-24 ${className}`}>{children}</div>
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
      className={`vbiz-section-banner group relative mb-4 w-full overflow-hidden rounded-4xl border p-5 shadow-sm md:mb-4 md:rounded-[2.5rem] md:p-6 lg:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
      <div className="bg-gold/10 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />

      <div className="relative z-10">
        <div className="vbiz-eyebrow mb-2 self-start shadow-sm backdrop-blur-md md:mb-3 md:text-xs">
          <Icon size={14} /> {badge}
        </div>
        <h2 className="vbiz-title mb-2 text-2xl leading-[1.15] font-black tracking-tight sm:text-4xl md:mb-2 lg:text-4xl">
          {typeof title === 'string' ? goldSplitTitle(title) : title}
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
  const { embedded } = useProfileDisplay()
  const displayMessage = embedded ? PREVIEW_EMPTY_MESSAGE : message

  return (
    <V3SectionShell>
      <div className="vbiz-card flex min-h-80 flex-col items-center justify-center rounded-4xl border border-dashed p-10 text-center">
        <div className="vbiz-pill-icon mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border">
          <Icon size={24} />
        </div>
        <h2 className="vbiz-title mb-3 text-2xl font-black tracking-tight">{title}</h2>
        <p className="vbiz-description max-w-md text-sm leading-relaxed font-medium">{displayMessage}</p>
      </div>
    </V3SectionShell>
  )
}

/** Inline published-copy that becomes the preview empty message in the editor live preview. */
export function V3PreviewAwareText({ published }: { published: string }) {
  const { embedded } = useProfileDisplay()
  return <>{embedded ? PREVIEW_EMPTY_MESSAGE : published}</>
}

type V3ErrorStateProps = {
  sectionTitle: string
}

export function V3ErrorState({ sectionTitle }: V3ErrorStateProps) {
  const { embedded } = useProfileDisplay()

  if (embedded) {
    return <V3EmptyState icon={Inbox} title={sectionTitle} message={PREVIEW_EMPTY_MESSAGE} />
  }

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false

  return (
    <V3SectionShell>
      <div
        className={`rounded-4xl border px-6 py-8 text-center text-sm font-medium ${
          offline
            ? 'border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
            : 'border-red-200 bg-red-50/80 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
        }`}
      >
        {offline
          ? `Connect to the internet to continue ${sectionTitle.toLowerCase()}. Other saved tabs still work offline.`
          : `Unable to load ${sectionTitle.toLowerCase()} right now. Please try again later.`}
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
