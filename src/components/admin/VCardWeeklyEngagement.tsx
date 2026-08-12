'use client'

import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { useLastGoodData } from '@/hooks/useLastGoodData'
import type { AdminCard } from '@/lib/admin/adminCardShape'
import { useGetWeeklyEngagementQuery } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { BarChart3, ChevronDown, Eye, Info, MousePointer, Percent, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type EngagementPersonal = {
  fullName?: string
  designation?: string
  department?: string
}

type EngagementTheme = {
  primaryColor?: string
}

/** Card shape used for scope badge / sidebar metadata (not chart totals). */
type EngagementCard = Pick<AdminCard, 'id' | 'status'> & {
  personal?: EngagementPersonal
  theme?: EngagementTheme
}

function asEngagementPersonal(personal: AdminCard['personal']): EngagementPersonal | undefined {
  if (!personal) return undefined
  return {
    fullName: typeof personal.fullName === 'string' ? personal.fullName : undefined,
    designation: typeof personal.designation === 'string' ? personal.designation : undefined,
    department: typeof personal.department === 'string' ? personal.department : undefined,
  }
}

function asEngagementTheme(theme: unknown): EngagementTheme | undefined {
  if (!theme || typeof theme !== 'object') return undefined
  const primaryColor = (theme as EngagementTheme).primaryColor
  return {
    primaryColor: typeof primaryColor === 'string' ? primaryColor : undefined,
  }
}

function toEngagementCard(card: AdminCard): EngagementCard {
  return {
    id: card.id,
    status: card.status,
    personal: asEngagementPersonal(card.personal),
    theme: asEngagementTheme(card.theme),
  }
}

interface VCardWeeklyEngagementProps {
  vCardsList: AdminCard[]
  defaultSelectedId?: string | null
  /** Personal/single account: hide Select Card dropdown and lock to current card */
  hideCardSelector?: boolean
  /** Corporate/admin totals: aggregate all cards — no per-card selector */
  aggregateAll?: boolean
  /** When nested inside a parent tabbed card, drop outer shell / margin */
  embedded?: boolean
  /** Scope weekly API to cards created by the current user (admin My Cards) */
  scope?: 'created'
}

export function VCardWeeklyEngagement({
  vCardsList,
  defaultSelectedId,
  hideCardSelector = false,
  aggregateAll = false,
  embedded = false,
  scope,
}: VCardWeeklyEngagementProps) {
  const [chartType, setChartType] = useState<'area' | 'trend'>('area')
  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    if (defaultSelectedId && vCardsList.some((c) => c.id === defaultSelectedId)) {
      return defaultSelectedId
    }
    return vCardsList[0]?.id || ''
  })

  const weeklyQueryArgs = useMemo(() => {
    if (aggregateAll) return scope ? { scope } : undefined
    const id = hideCardSelector ? defaultSelectedId || vCardsList[0]?.id : selectedCardId || vCardsList[0]?.id
    if (!id) return scope ? { scope } : undefined
    return { profileId: id, ...(scope ? { scope } : {}) }
  }, [aggregateAll, scope, hideCardSelector, defaultSelectedId, selectedCardId, vCardsList])

  const { data: weeklyRaw, isLoading: weeklyLoading } = useGetWeeklyEngagementQuery(weeklyQueryArgs, {
    skip: !aggregateAll && !(weeklyQueryArgs && 'profileId' in weeklyQueryArgs && weeklyQueryArgs.profileId),
  })
  const weekly = useLastGoodData(weeklyRaw)

  /** Metadata card for scope badge / status / department — chart uses API weekly data. */
  const activeCard = useMemo((): EngagementCard | null => {
    if (aggregateAll) {
      if (!vCardsList.length) return null
      const anyActive = vCardsList.some((c) => c.status === 'active')
      const departments = [
        ...new Set(
          vCardsList.map((c) => asEngagementPersonal(c.personal)?.department).filter((d): d is string => Boolean(d))
        ),
      ]
      const isMyCards = scope === 'created'
      return {
        id: '__all__',
        personal: {
          fullName: isMyCards ? 'My cards' : 'All directory cards',
          designation: `${vCardsList.length} profiles`,
          department: departments.length === 1 ? departments[0] : departments.length > 1 ? 'Multiple' : undefined,
        },
        theme: asEngagementTheme(vCardsList[0]?.theme),
        status: anyActive ? 'active' : vCardsList[0]?.status || 'active',
      }
    }
    if (hideCardSelector) {
      const locked = (defaultSelectedId && vCardsList.find((c) => c.id === defaultSelectedId)) || vCardsList[0] || null
      return locked ? toEngagementCard(locked) : null
    }
    const card = vCardsList.find((c) => c.id === selectedCardId)
    const resolved = card || vCardsList[0] || null
    return resolved ? toEngagementCard(resolved) : null
  }, [vCardsList, selectedCardId, hideCardSelector, defaultSelectedId, aggregateAll, scope])

  const weeklyDays = useMemo(() => weekly?.days ?? [], [weekly?.days])
  const totals = weekly?.totals ?? { views: 0, clicks: 0, avgCtr: 0 }
  const avgCtr = totals.avgCtr

  const peakDay = useMemo(() => {
    if (!weeklyDays.length) return null
    return weeklyDays.reduce((best, day) => (day.views + day.clicks > best.views + best.clicks ? day : best))
  }, [weeklyDays])

  const insightName = aggregateAll
    ? scope === 'created'
      ? 'My cards'
      : 'Directory'
    : activeCard?.personal?.fullName || weekly?.profileName || 'Member'

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
        <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 bg-indigo-600/5 blur-[100px] dark:bg-indigo-500/2"></div>
      )}

      {/* Header section with Select Dropdown */}
      <div
        className={cn(
          'z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center',
          embedded ? 'mb-2 pb-4' : 'border-b border-slate-100 pb-6 dark:border-white/5'
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
                ? scope === 'created'
                  ? 'Weekly click-throughs vs profile visits across your admin-created cards'
                  : 'Weekly click-throughs vs profile visits across all directory cards'
                : 'Weekly click-throughs vs profile visits for your current card'}
            </p>
          )}
        </div>

        {aggregateAll || hideCardSelector ? (
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-slate-900">
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
        ) : (
          <div className="flex shrink-0 items-center gap-3">
            <label htmlFor="card-visualizer-select" className="text-xs font-bold whitespace-nowrap text-slate-400">
              Select Card:
            </label>
            <div className="relative">
              <select
                id="card-visualizer-select"
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-xs font-extrabold text-slate-800 shadow-xs transition-all outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                {vCardsList.map((card) => {
                  const personal = asEngagementPersonal(card.personal)
                  return (
                    <option key={card.id} value={card.id}>
                      {personal?.fullName || 'Unnamed Card'} — {personal?.designation || 'Specialist'}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {weeklyLoading && !weekly ? (
        <div className="z-10 rounded-2xl border border-dashed border-slate-200/80 py-12 text-center text-sm font-semibold text-slate-400 dark:border-white/10">
          Loading weekly engagement…
        </div>
      ) : (
        <>
          {/* Highlights Metrics Panel */}
          <div className="z-10 my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#0b0f19]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Weekly Views
                </span>
                <span className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={totals.views} />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#0b0f19]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <MousePointer className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Weekly Clicks
                </span>
                <span className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={totals.clicks} />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#0b0f19]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Avg. CTR Rate
                </span>
                <span className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">{avgCtr}%</span>
              </div>
            </div>
          </div>

          {/* Main Dual Charts Frame */}
          <div className="z-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            {/* Recharts Container */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 lg:col-span-8 dark:border-white/5 dark:bg-white/2">
              <div className="mb-6 flex flex-col justify-between gap-3 text-xs font-bold text-slate-500 sm:flex-row sm:items-center">
                <span>Last 7 days (by weekday)</span>
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

                  <div className="flex shrink-0 items-center rounded-xl border border-slate-200/50 bg-slate-100 p-1 dark:border-white/5 dark:bg-slate-900/60">
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
                        <linearGradient id="chartViewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="chartClicksGrad" x1="0" y1="0" x2="0" y2="1">
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
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="min-w-45 rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-left text-xs text-white shadow-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
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
                                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-1.5 text-[11px] font-extrabold">
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
                        fill="url(#chartViewsGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        name="Clicks"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartClicksGrad)"
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
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="min-w-45 rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-left text-xs text-white shadow-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
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

            {/* Dynamic Engagement Analysis Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-6 lg:col-span-4 dark:border-white/5 dark:bg-white/2">
              <div className="space-y-4">
                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Acoustic Insights</h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {avgCtr >= 35 ? (
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
                        {avgCtr >= 35 ? 'High Conversion Velocity' : 'Moderate CTA Attraction'}
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed font-semibold text-slate-400">
                        {avgCtr >= 35
                          ? `${insightName}'s digital card is converting traffic at an exceptionally efficient rate. Visitors are actively clicking dynamic outgoing portfolio resources.`
                          : `The card is capturing visual attention but link clicks are hovering around average. Try placing primary contact channels or action buttons at the top layout.`}
                      </p>
                    </div>
                  </div>

                  {peakDay && peakDay.views + peakDay.clicks > 0 ? (
                    <div className="flex gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[11px] leading-relaxed font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-indigo-500" />
                      <span>
                        {peakDay.fullDay} had the highest activity in the last 7 days, with {peakDay.views} views and{' '}
                        {peakDay.clicks} link clicks.
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[11px] leading-relaxed font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-indigo-500" />
                      <span>
                        No engagement recorded in the last 7 days yet. Share your vCards to start seeing weekly trends.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Card Status:</span>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 text-[10px] font-black uppercase',
                      activeCard.status === 'active'
                        ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-amber-500/25 bg-amber-500/10 text-amber-500'
                    )}
                  >
                    {activeCard.status || 'active'}
                  </span>
                </div>
                {activeCard.personal?.department ? (
                  <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Department:</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">
                      {activeCard.personal.department}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
