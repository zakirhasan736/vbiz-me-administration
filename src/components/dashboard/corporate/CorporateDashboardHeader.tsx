'use client'

import { StatNumber } from '@/components/ui/StatNumber'
import { CreateCardLauncher } from '@/components/vcard/create-agent/CreateCardLauncher'
import type { DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { AlertCircle, Download, MessageCircle, Plus, type LucideIcon } from 'lucide-react'

type CorporateDashboardHeaderProps = {
  quotaLimit?: number
  activeCount?: number
  cardCount?: number
  totalViews?: number
  uniqueViews?: number
  shares?: number
  statsLoading?: boolean
  profilesLoading?: boolean
  canCreate: boolean
  createDisabledReason: string
  onExportCsv: () => void
  onFeedback: () => void
  onSupport: () => void
}

const badgeSkeleton = 'h-3 w-8 rounded bg-white/25'

export function CorporateDashboardHeader({
  quotaLimit,
  activeCount,
  cardCount,
  totalViews,
  uniqueViews,
  shares,
  statsLoading = false,
  profilesLoading = false,
  canCreate,
  createDisabledReason,
  onExportCsv,
  onFeedback,
  onSupport,
}: CorporateDashboardHeaderProps) {
  const directoryLoading = profilesLoading

  return (
    <div className="relative z-40 overflow-visible rounded-[36px] border border-slate-700 bg-linear-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl md:p-10 dark:border-white/10 dark:from-slate-800 dark:to-slate-900">
      <div className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 h-100 w-100 overflow-hidden rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-62.5 w-62.5 rounded-full bg-white/5 blur-2xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl space-y-3">
          <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-black tracking-widest uppercase">
            Corporate Control Center
          </span>
          <h1 className="text-3xl leading-tight font-black tracking-tight text-white md:text-4xl">
            Consolidated Analytics
          </h1>
          <p className="inline-flex flex-wrap items-center gap-1 text-sm leading-relaxed font-medium text-slate-300 md:text-[14.5px]">
            Monitor global analytics, track role-based access controls, and manage directory permissions for up to{' '}
            <StatNumber
              value={quotaLimit}
              loading={directoryLoading}
              className="font-medium text-slate-300"
              skeletonClassName="h-4 w-8 rounded bg-white/25"
            />{' '}
            digital cards.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge>
              <StatNumber
                value={activeCount}
                loading={directoryLoading}
                className="font-black text-white/80"
                skeletonClassName={badgeSkeleton}
              />{' '}
              Active
            </Badge>
            <Badge>
              <StatNumber
                value={cardCount}
                loading={directoryLoading}
                className="font-black text-white/80"
                skeletonClassName={badgeSkeleton}
              />{' '}
              /{' '}
              <StatNumber
                value={quotaLimit}
                loading={directoryLoading}
                className="font-black text-white/80"
                skeletonClassName={badgeSkeleton}
              />{' '}
              Seats
            </Badge>
            <Badge>
              <StatNumber
                value={totalViews}
                loading={statsLoading}
                live
                className="font-black text-white/80"
                skeletonClassName={badgeSkeleton}
              />{' '}
              Views
            </Badge>
            <Badge>
              <StatNumber
                value={uniqueViews}
                loading={statsLoading}
                live
                className="font-black text-white/80"
                skeletonClassName={badgeSkeleton}
              />{' '}
              Unique
            </Badge>
            <Badge>
              <StatNumber
                value={shares}
                loading={statsLoading}
                className="font-black text-white/80"
                skeletonClassName={badgeSkeleton}
              />{' '}
              Shares
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <HeaderButton icon={Download} label="Export CSV" onClick={onExportCsv} />
          <HeaderButton icon={MessageCircle} label="Feedback" onClick={onFeedback} iconClass="text-emerald-500" />
          <HeaderButton icon={AlertCircle} label="Contact Support" onClick={onSupport} iconClass="text-indigo-400" />
          {canCreate ? (
            <CreateCardLauncher>
              {(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Create Corporate Card
                </button>
              )}
            </CreateCardLauncher>
          ) : (
            <button
              type="button"
              disabled
              title={createDisabledReason}
              className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-white/40 px-5 py-2.5 text-xs font-bold text-slate-400 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create Corporate Card
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-white/80 uppercase">
      {children}
    </span>
  )
}

function HeaderButton({
  icon: Icon,
  label,
  onClick,
  iconClass,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  iconClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
    >
      <Icon className={cn('h-4 w-4 text-slate-500 dark:text-slate-400', iconClass)} />
      <span>{label}</span>
    </button>
  )
}

export function CorporateEmptyState({
  canCreate,
  createDisabledReason,
}: {
  canCreate: boolean
  createDisabledReason: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border border-slate-200 bg-white px-4 py-24 text-center shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
      <div className="bg-primary-50 dark:bg-primary-500/10 mb-6 flex h-24 w-24 items-center justify-center rounded-full">
        <Plus className="text-primary-500 h-12 w-12" strokeWidth={1.5} />
      </div>
      <h3 className="mb-3 text-2xl font-extrabold text-slate-900 dark:text-white">No Corporate Cards Found</h3>
      <p className="mx-auto mb-8 max-w-md font-medium text-slate-500 dark:text-slate-400">
        Your corporate directory is empty. Create your first vCard to unlock analytics, team management, and secure
        sharing features.
      </p>
      {canCreate ? (
        <CreateCardLauncher>
          {(open) => (
            <button
              type="button"
              onClick={open}
              className="bg-primary-600 hover:bg-primary-700 shadow-primary-500/20 flex items-center gap-2 rounded-xl px-8 py-3.5 text-[14px] font-bold text-white shadow-sm transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" /> Add New VCard
            </button>
          )}
        </CreateCardLauncher>
      ) : (
        <button
          type="button"
          disabled
          title={createDisabledReason}
          className="cursor-not-allowed rounded-xl bg-slate-200 px-8 py-3.5 text-[14px] font-bold text-slate-400"
        >
          Add New VCard
        </button>
      )}
    </div>
  )
}

export function CorporateQuotaWarning({
  cardCount,
  quotaLimit,
  onRequestUpgrade,
}: {
  cardCount: number
  quotaLimit: number
  onRequestUpgrade: () => void
}) {
  const threshold = Math.max(1, Math.floor(quotaLimit * 0.9))
  if (cardCount < threshold) return null

  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-red-500/20 bg-linear-to-r from-red-500/15 via-pink-500/10 to-transparent p-6 shadow-sm md:flex-row md:items-center">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <div className="text-left">
          <h4 className="text-sm leading-tight font-black text-slate-900 dark:text-white">
            Corporate Directory Warning: 90%+ Quota Limit Reached
          </h4>
          <p className="mt-1 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            Your team directory has utilized{' '}
            <span className="font-bold text-red-500">
              {cardCount} of {quotaLimit}
            </span>{' '}
            slots. Please prune outdated profiles or upgrade your enterprise plan to permit more creations.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRequestUpgrade}
        className="shrink-0 self-start rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-600 active:scale-95 md:self-auto"
      >
        Request Upgrade
      </button>
    </div>
  )
}

export type { DashboardSocialChannel }
