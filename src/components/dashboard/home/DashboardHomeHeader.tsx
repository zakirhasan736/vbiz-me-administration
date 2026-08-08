'use client'

import type { DashboardPeriod } from '@/redux/features/profiles/profiles.api'
import { AlertCircle, Download, Loader2, MessageCircle } from 'lucide-react'

type DashboardHomeHeaderProps = {
  period: DashboardPeriod
  onPeriodChange: (period: DashboardPeriod) => void
  onExport?: () => void
  exporting?: boolean
  onFeedback?: () => void
  onContactSupport?: () => void
  subtitle?: string
}

export function DashboardHomeHeader({
  period,
  onPeriodChange,
  onExport,
  exporting = false,
  onFeedback,
  onContactSupport,
  subtitle = 'Track your individual vCard performance and engagement metrics in real-time.',
}: DashboardHomeHeaderProps) {
  return (
    <div
      data-tour="dash-header"
      className="relative mb-8 flex flex-col justify-between gap-4 overflow-hidden rounded-4xl border border-slate-200/80 bg-white p-8 shadow-sm sm:flex-row sm:items-end dark:border-white/10 dark:bg-[#0b0f19]"
    >
      <div className="bg-primary-600/5 pointer-events-none absolute top-0 right-0 h-80 w-80 blur-[120px]" />
      <div className="z-10">
        <h1 className="text-[32px] leading-tight font-black tracking-tight text-slate-900 sm:text-[40px] dark:text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 sm:text-[15px] dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="z-10 flex flex-wrap items-center gap-3" data-tour="dash-actions">
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as DashboardPeriod)}
          className="cursor-pointer rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all outline-none hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-300 dark:hover:bg-white/5"
          aria-label="Date range"
        >
          <option value="all">All</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || !onExport}
          className="flex items-center gap-2 rounded-[14px] bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Exporting…' : 'Export'}
        </button>
        <button
          type="button"
          onClick={onFeedback}
          className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white dark:hover:bg-white/5"
        >
          <MessageCircle className="h-4 w-4 text-emerald-500" /> Feedback
        </button>
        <button
          type="button"
          onClick={onContactSupport}
          className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white dark:hover:bg-white/5"
        >
          <AlertCircle className="h-4 w-4 text-indigo-500" /> Contact Support
        </button>
      </div>
    </div>
  )
}
