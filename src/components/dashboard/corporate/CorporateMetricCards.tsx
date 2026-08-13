'use client'

import { StatNumber } from '@/components/ui/StatNumber'
import { cn } from '@/utils/cn'
import { Eye, Save, Shield, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'

type MetricCardProps = {
  title: string
  metrics?: React.ReactNode
  icon: LucideIcon
  changeText?: string
  changeNegative?: boolean
  subtitle?: React.ReactNode
  iconBgClassName?: string
  onClick?: () => void
}

function MetricCard({
  title,
  metrics,
  icon: Icon,
  changeText,
  changeNegative,
  subtitle,
  iconBgClassName = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  onClick,
}: MetricCardProps) {
  const Wrapper = onClick ? 'button' : 'div'
  const TrendIcon = changeNegative ? TrendingDown : TrendingUp
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-[28px] border border-slate-200/80 bg-white p-6 text-left shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
        onClick && 'cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md'
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', iconBgClassName)}>
          <Icon className="h-6 w-6" />
        </div>
        {changeText ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-bold',
              changeNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" /> {changeText}
          </span>
        ) : null}
      </div>
      <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">{title}</p>
      <div className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{metrics}</div>
      {subtitle ? <div className="mt-2 text-xs font-semibold text-slate-400">{subtitle}</div> : null}
    </Wrapper>
  )
}

type CorporateMetricCardsProps = {
  totalViews?: number
  totalSaves?: number
  activeCount?: number
  totalCards?: number
  quotaLimit?: number
  loading?: boolean
  profilesLoading?: boolean
  viewsChangeText?: string
  viewsChangeNegative?: boolean
  savesChangeText?: string
  savesChangeNegative?: boolean
  onOpenContactSaves?: () => void
}

export function CorporateMetricCards({
  totalViews,
  totalSaves,
  activeCount,
  totalCards,
  quotaLimit,
  loading = false,
  profilesLoading = false,
  viewsChangeText,
  viewsChangeNegative,
  savesChangeText,
  savesChangeNegative,
  onOpenContactSaves,
}: CorporateMetricCardsProps) {
  const directoryLoading = loading || profilesLoading

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <MetricCard
        title="Multi-Card Views"
        metrics={
          <StatNumber
            value={totalViews}
            loading={loading}
            className="text-3xl font-black text-slate-900 dark:text-white"
            skeletonClassName="h-9 w-24 rounded-xl"
          />
        }
        icon={Eye}
        changeText={loading ? undefined : viewsChangeText}
        changeNegative={viewsChangeNegative}
        iconBgClassName="bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
      />
      <MetricCard
        title="Total Contacts Saved"
        metrics={
          <StatNumber
            value={totalSaves}
            loading={loading}
            className="text-3xl font-black text-slate-900 dark:text-white"
            skeletonClassName="h-9 w-24 rounded-xl"
          />
        }
        icon={Save}
        changeText={loading ? undefined : savesChangeText}
        changeNegative={savesChangeNegative}
        subtitle="Click to view guest names, phones, emails & device metadata"
        iconBgClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        onClick={onOpenContactSaves}
      />
      <MetricCard
        title="Active Directory"
        metrics={
          <span className="inline-flex items-center gap-1.5">
            <StatNumber
              value={activeCount}
              loading={directoryLoading}
              className="text-3xl font-black text-slate-900 dark:text-white"
              skeletonClassName="h-9 w-10 rounded-xl"
            />
            <span className="text-3xl font-black text-slate-400">/</span>
            <StatNumber
              value={totalCards}
              loading={directoryLoading}
              className="text-3xl font-black text-slate-900 dark:text-white"
              skeletonClassName="h-9 w-10 rounded-xl"
            />
          </span>
        }
        icon={Shield}
        subtitle={
          <span className="inline-flex items-center gap-1">
            Capacity: up to{' '}
            <StatNumber
              value={quotaLimit}
              loading={directoryLoading}
              className="font-semibold text-slate-400"
              skeletonClassName="h-3.5 w-8 rounded-md"
            />{' '}
            Card creations
          </span>
        }
        iconBgClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
      />
    </div>
  )
}
