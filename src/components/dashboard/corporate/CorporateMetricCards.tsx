'use client'

import { cn } from '@/utils/cn'
import { Eye, Save, Shield, TrendingUp, type LucideIcon } from 'lucide-react'

type MetricCardProps = {
  title: string
  metrics: string
  icon: LucideIcon
  changeText?: string
  subtitle?: string
  iconBgClassName?: string
  onClick?: () => void
}

function MetricCard({
  title,
  metrics,
  icon: Icon,
  changeText,
  subtitle,
  iconBgClassName = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  onClick,
}: MetricCardProps) {
  const Wrapper = onClick ? 'button' : 'div'
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
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" /> {changeText}
          </span>
        ) : null}
      </div>
      <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">{title}</p>
      <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{metrics}</p>
      {subtitle ? <p className="mt-2 text-xs font-semibold text-slate-400">{subtitle}</p> : null}
    </Wrapper>
  )
}

type CorporateMetricCardsProps = {
  totalViews: number
  totalSaves: number
  activeCount: number
  totalCards: number
  quotaLimit: number
  onOpenContactSaves?: () => void
}

export function CorporateMetricCards({
  totalViews,
  totalSaves,
  activeCount,
  totalCards,
  quotaLimit,
  onOpenContactSaves,
}: CorporateMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <MetricCard
        title="Multi-Card Views"
        metrics={totalViews.toLocaleString()}
        icon={Eye}
        changeText="+18.4%"
        iconBgClassName="bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
      />
      <MetricCard
        title="Total Contacts Saved"
        metrics={totalSaves.toLocaleString()}
        icon={Save}
        changeText="+12.1%"
        subtitle="Click to view guest names, phones, emails & device metadata"
        iconBgClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        onClick={onOpenContactSaves}
      />
      <MetricCard
        title="Active Directory"
        metrics={`${activeCount} / ${totalCards}`}
        icon={Shield}
        subtitle={`Capacity: up to ${quotaLimit} Card creations`}
        iconBgClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
      />
    </div>
  )
}
