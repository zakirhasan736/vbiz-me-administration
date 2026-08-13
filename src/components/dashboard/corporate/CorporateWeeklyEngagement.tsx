'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { StatNumber } from '@/components/ui/StatNumber'
import { useGetWeeklyEngagementQuery } from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { BarChart3, Eye, Info, MousePointer, Percent, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type CorporateWeeklyEngagementProps = {
  vCardsList: VCardRecord[]
  /** Corporate totals: aggregate all cards — no per-card selector */
  aggregateAll?: boolean
  /** When nested inside a parent tabbed card, drop outer shell / margin */
  embedded?: boolean
  /** When false, skip the weekly API fetch (parent tab inactive) */
  active?: boolean
}

type WeeklyDay = {
  day: string
  fullDay: string
  views: number
  clicks: number
  ctr: number
}

/**
 * Corporate weekly visualizer — same shape as single-card / admin weekly engagement,
 * scoped to all directory cards via `/profiles/dashboard/weekly-engagement`.
 */
export function CorporateWeeklyEngagement({
  vCardsList,
  aggregateAll = false,
  embedded = false,
  active = true,
}: CorporateWeeklyEngagementProps) {
  const [chartType, setChartType] = useState<'area' | 'trend'>('area')
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyEngagementQuery(undefined, {
    skip: !active,
  })

  const activeCard = useMemo(() => {
    if (!vCardsList.length) return null
    if (aggregateAll) {
      const departments = [
        ...new Set(vCardsList.map((c) => c.personal?.profession).filter((d): d is string => Boolean(d))),
      ]
      return {
        id: '__all__',
        personal: {
          fullName: weekly?.profileName || 'All directory cards',
          designation: `${vCardsList.length} profiles`,
          department: departments.length === 1 ? departments[0] : departments.length > 1 ? 'Multiple' : 'Directory',
        },
        theme: vCardsList[0]?.theme,
        isActive: vCardsList.some((c) => c.isActive),
      }
    }
    const card = vCardsList[0]
    return {
      id: card.id,
      personal: {
        fullName: card.personal?.fullName,
        designation: card.personal?.designation,
        department: card.personal?.profession || 'Engineering',
      },
      theme: card.theme,
      isActive: card.isActive,
    }
  }, [vCardsList, aggregateAll, weekly?.profileName])

  const weeklyDays = useMemo((): WeeklyDay[] => weekly?.days ?? [], [weekly?.days])
  const isWeeklyPending = weeklyLoading && !weekly
  const totals = weekly?.totals
  const avgCtr = totals?.avgCtr

  const peakDay = useMemo(() => {
    if (!weeklyDays.length) return null
    return weeklyDays.reduce((best, day) => (day.views + day.clicks > best.views + best.clicks ? day : best))
  }, [weeklyDays])

  if (!activeCard) {
    return (
      <div className="rounded-4xl border border-slate-200/80 bg-white p-8 text-center dark:border-white/10 dark:bg-[#0b0f19]">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 animate-pulse text-slate-300 dark:text-white/15" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          No active vCard profiles found for visualization.
        </p>
      </div>
    )
  }

  const primaryColor = activeCard.theme?.primaryColor || '#6366f1'
  const statusLabel = activeCard.isActive ? 'active' : 'inactive'
  const insightName = aggregateAll ? 'Directory' : activeCard.personal?.fullName || weekly?.profileName || 'Member'

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden',
        embedded
          ? 'mb-0 border-0 bg-transparent p-0 shadow-none'
          : 'group mb-10 rounded-4xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] sm:p-8 dark:border-white/10 dark:bg-[#0b0f19] dark:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]'
      )}
    >
      {!embedded && (
        <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 bg-indigo-600/5 blur-[100px] dark:bg-indigo-500/2" />
      )}

      <div
        className={cn(
          'z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center',
          embedded
            ? 'mb-2 border-b border-slate-200/80 pb-4 dark:border-white/10'
            : 'border-b border-slate-100 pb-6 dark:border-white/5'
        )}
      >
        <div>
          {!embedded && (
            <>
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Weekly Engagement Visualizer
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                Analytic click-throughs vs profile visits mapped dynamically on a weekly timescale
              </p>
            </>
          )}
          {embedded && (
            <p className="text-xs font-semibold text-slate-400">
              {aggregateAll
                ? 'Weekly click-throughs vs profile visits across all directory cards'
                : 'Weekly click-throughs vs profile visits for your current card'}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
            {aggregateAll ? 'Scope' : 'Current card'}
          </span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
            {activeCard.personal?.fullName || 'My vCard'}
            {activeCard.personal?.designation ? (
              <span className="font-semibold text-slate-400"> · {activeCard.personal.designation}</span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="z-10 my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-br from-indigo-50/70 to-white p-4 shadow-sm dark:border-white/10 dark:from-indigo-500/10 dark:to-transparent">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Weekly Views</span>
            <span className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">
              <StatNumber value={totals?.views} loading={isWeeklyPending} skeletonClassName="mt-0.5 h-6 w-14" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-br from-emerald-50/70 to-white p-4 shadow-sm dark:border-white/10 dark:from-emerald-500/10 dark:to-transparent">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <MousePointer className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Weekly Clicks</span>
            <span className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">
              <StatNumber value={totals?.clicks} loading={isWeeklyPending} skeletonClassName="mt-0.5 h-6 w-14" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-br from-violet-50/70 to-white p-4 shadow-sm dark:border-white/10 dark:from-violet-500/10 dark:to-transparent">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Avg. CTR Rate</span>
            <div className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">
              {isWeeklyPending || avgCtr == null ? <Skeleton className="mt-0.5 h-6 w-14" /> : `${avgCtr}%`}
            </div>
          </div>
        </div>
      </div>

      {isWeeklyPending ? (
        <div className="z-10 rounded-2xl border border-dashed border-slate-200/80 py-12 text-center text-sm font-semibold text-slate-400 dark:border-white/10">
          Loading weekly engagement…
        </div>
      ) : (
        <div className="z-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/30 p-5 lg:col-span-8 dark:border-white/10 dark:bg-white/0.5">
            <div className="mb-6 flex flex-col justify-between gap-3 text-xs font-bold text-slate-500 sm:flex-row sm:items-center">
              <span>Weekly Frequency (Mon - Sun)</span>
              <div className="flex flex-wrap items-center gap-4">
                {chartType === 'area' ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded bg-indigo-500" style={{ backgroundColor: primaryColor }} />
                      Profile Views
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                      Link Clicks
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded bg-indigo-500" style={{ backgroundColor: primaryColor }} />
                      Daily Traffic
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded bg-blue-500" />
                      CTR (%)
                    </span>
                  </>
                )}

                <div className="flex shrink-0 items-center rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-white/10 dark:bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => setChartType('area')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-[10px] font-black tracking-wider uppercase transition-all',
                      chartType === 'area'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-white/10 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    )}
                  >
                    Volume Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('trend')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-[10px] font-black tracking-wider uppercase transition-all',
                      chartType === 'trend'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-white/10 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    )}
                  >
                    CTR Trend Line
                  </button>
                </div>
              </div>
            </div>

            <div className="h-70 w-full">
              {chartType === 'area' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="corpChartViewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="corpChartClicksGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active: tipActive, payload }) => {
                        if (tipActive && payload && payload.length) {
                          const data = payload[0].payload as WeeklyDay
                          return (
                            <div className="min-w-45 rounded-2xl border border-slate-200/80 bg-slate-900/95 p-4 text-left text-xs text-white shadow-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
                              <p className="mb-1.5 font-black tracking-widest text-indigo-400 uppercase">
                                {data.fullDay}
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4 font-bold">
                                  <span className="text-slate-300">Profile Views:</span>
                                  <span className="text-white">{data.views}</span>
                                </div>
                                <div className="flex justify-between gap-4 font-bold">
                                  <span className="text-slate-300">Link Clicks:</span>
                                  <span className="text-white">{data.clicks}</span>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-white/10 pt-1.5 text-[11px] font-extrabold">
                                  <span className="text-emerald-400">CTR Efficiency:</span>
                                  <span className="text-emerald-400">{data.ctr}%</span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke={primaryColor}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#corpChartViewsGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#corpChartClicksGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyDays} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke={primaryColor}
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#3b82f6"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      content={({ active: tipActive, payload }) => {
                        if (tipActive && payload && payload.length) {
                          const data = payload[0].payload as WeeklyDay
                          return (
                            <div className="min-w-45 rounded-2xl border border-slate-200/80 bg-slate-900/95 p-4 text-left text-xs text-white shadow-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
                              <p className="mb-1.5 font-black tracking-widest text-indigo-400 uppercase">
                                {data.fullDay}
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4 font-bold">
                                  <span className="text-slate-300">Daily Traffic:</span>
                                  <span className="text-white">{data.views} views</span>
                                </div>
                                <div className="flex justify-between gap-4 font-bold">
                                  <span className="text-slate-300">Conversion (CTR):</span>
                                  <span className="text-blue-400">{data.ctr}%</span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="views"
                      name="Daily Traffic"
                      stroke={primaryColor}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ctr"
                      name="CTR %"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 lg:col-span-4 dark:border-white/10 dark:bg-white/1">
            <div className="space-y-4">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Acoustic Insights</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {(avgCtr ?? 0) >= 35 ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </div>
                  ) : (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                      <TrendingDown className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-[12.5px] font-extrabold text-slate-900 dark:text-white">
                      {(avgCtr ?? 0) >= 35 ? 'High Conversion Velocity' : 'Moderate CTA Attraction'}
                    </h4>
                    <p className="mt-1 text-[11px] leading-relaxed font-semibold text-slate-400">
                      {(avgCtr ?? 0) >= 35
                        ? `${insightName}'s digital cards are converting traffic at an exceptionally efficient rate. Visitors are actively clicking dynamic outgoing portfolio resources.`
                        : `Cards are capturing visual attention but link clicks are hovering around average. Try placing primary contact channels or action buttons at the top layout.`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[11px] leading-relaxed font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-indigo-500" />
                  <span>
                    {peakDay
                      ? `${peakDay.fullDay} is on average the highest activity day this week, with click-through spikes matching maximum viewer traffic.`
                      : 'Share directory cards to start seeing weekly peak-day insights.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Card Status:</span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 text-[10px] font-black uppercase',
                    statusLabel === 'active'
                      ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-amber-500/25 bg-amber-500/10 text-amber-500'
                  )}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Department:</span>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {activeCard.personal?.department || 'Directory'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
