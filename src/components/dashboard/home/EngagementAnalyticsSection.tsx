'use client'

import { useLiveSocialClicks } from '@/hooks/useLiveSocialClicks'
import { useGetWeeklyEngagementQuery, type DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import {
  Eye,
  Facebook,
  Globe,
  Info,
  Instagram,
  Linkedin,
  MessageCircle,
  MousePointer,
  MousePointerClick,
  Music2,
  Percent,
  Pin,
  Radio,
  TrendingDown,
  TrendingUp,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type SeedChannel = {
  channel: DashboardSocialChannel
  label: string
  count: number
  trendPercent: number
}

type EngagementAnalyticsSectionProps = {
  socialChannels?: SeedChannel[]
}

const BAR_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
const PRIMARY_COLOR = '#6366f1'

const CHANNEL_UI: Record<string, { icon: LucideIcon; color: string; bg: string; bar: string }> = {
  facebook: { icon: Facebook, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', bar: '#1877F2' },
  twitter: { icon: Twitter, color: 'text-[#1DA1F2]', bg: 'bg-[#1DA1F2]/10', bar: '#1DA1F2' },
  instagram: { icon: Instagram, color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', bar: '#E4405F' },
  whatsapp: { icon: MessageCircle, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10', bar: '#25D366' },
  linkedin: { icon: Linkedin, color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10', bar: '#0A66C2' },
  youtube: { icon: Youtube, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', bar: '#FF0000' },
  tiktok: {
    icon: Music2,
    color: 'text-slate-900 dark:text-white',
    bg: 'bg-slate-900/10 dark:bg-white/10',
    bar: '#6366f1',
  },
  truth: { icon: Radio, color: 'text-[#5415D0]', bg: 'bg-[#5415D0]/10', bar: '#5415D0' },
  rumble: { icon: Radio, color: 'text-[#85C742]', bg: 'bg-[#85C742]/10', bar: '#85C742' },
  pinterest: { icon: Pin, color: 'text-[#E60023]', bg: 'bg-[#E60023]/10', bar: '#E60023' },
  website: {
    icon: Globe,
    color: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-500/10',
    bar: '#64748b',
  },
}

function channelUi(channel: string) {
  return (
    CHANNEL_UI[channel] ?? {
      icon: Globe,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      bar: '#6366f1',
    }
  )
}

export function EngagementAnalyticsSection({ socialChannels }: EngagementAnalyticsSectionProps) {
  const [tab, setTab] = useState<'live' | 'weekly'>('live')
  const [chartType, setChartType] = useState<'area' | 'trend'>('area')
  const { clicks, connected } = useLiveSocialClicks(socialChannels)
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyEngagementQuery(undefined, {
    skip: tab !== 'weekly',
  })

  const weeklyDays = useMemo(() => weekly?.days ?? [], [weekly?.days])
  const totals = weekly?.totals ?? { views: 0, clicks: 0, avgCtr: 0 }
  const profileName = weekly?.profileName || 'Your card'
  const avgCtr = totals.avgCtr
  const totalLiveClicks = useMemo(() => clicks.reduce((sum, row) => sum + row.clickCount, 0), [clicks])
  const topChannel = clicks[0]

  const peakDay = useMemo(() => {
    if (!weeklyDays.length) return null
    return weeklyDays.reduce((best, day) => (day.views + day.clicks > best.views + best.clicks ? day : best))
  }, [weeklyDays])

  const chartData = useMemo(
    () =>
      clicks.map((row) => ({
        ...row,
        fill: channelUi(row.channel).bar,
      })),
    [clicks]
  )

  return (
    <div className="mb-10 overflow-hidden rounded-4xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
      <div className="border-b border-slate-100 px-5 pt-5 pb-0 sm:px-8 sm:pt-6 dark:border-white/5">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Engagement Analytics</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Switch between live link clicks and weekly performance
            </p>
          </div>
          <div className="inline-flex self-start rounded-2xl border border-slate-200/80 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab('live')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-black tracking-wider uppercase transition-all',
                tab === 'live'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Live Tracker
            </button>
            <button
              type="button"
              onClick={() => setTab('weekly')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-black tracking-wider uppercase transition-all',
                tab === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Weekly Engagement
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        {tab === 'live' ? (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Social Link Clicks</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  Real-time tracking of individual link clicks across your vCard profile
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider uppercase',
                    connected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  )}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className={cn(
                        'absolute inline-flex h-full w-full rounded-full opacity-75',
                        connected ? 'animate-ping bg-emerald-400' : 'bg-amber-400'
                      )}
                    />
                    <span
                      className={cn(
                        'relative inline-flex h-1.5 w-1.5 rounded-full',
                        connected ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                    />
                  </span>
                  {connected ? 'Live' : 'Reconnecting'}
                </span>
                <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-indigo-500 uppercase">
                  Click Tracker
                </span>
              </div>
            </div>

            {clicks.length > 0 ? (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-indigo-50/80 to-white p-4 dark:border-white/10 dark:from-indigo-500/10 dark:to-transparent">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Total clicks</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {totalLiveClicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-sky-50/80 to-white p-4 dark:border-white/10 dark:from-sky-500/10 dark:to-transparent">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Channels hit</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{clicks.length}</p>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-linear-to-br from-emerald-50/80 to-white p-4 sm:col-span-1 dark:border-white/10 dark:from-emerald-500/10 dark:to-transparent">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Top channel</p>
                    <p className="mt-1 truncate text-lg font-black text-slate-900 dark:text-white">
                      {topChannel?.label ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    {clicks.map((click, index) => {
                      const maxCount = Math.max(...clicks.map((c) => c.clickCount), 1)
                      const percent = Math.round((click.clickCount / maxCount) * 100)
                      const ui = channelUi(click.channel)
                      const Icon = ui.icon
                      return (
                        <div
                          key={click.channel}
                          className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-sm dark:border-white/5 dark:bg-white/2 dark:hover:border-indigo-500/30 dark:hover:bg-white/4"
                        >
                          <div className="mb-2.5 flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                                ui.bg,
                                ui.color
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-bold text-slate-800 dark:text-zinc-100">
                                  {click.label}
                                </span>
                                <span className="shrink-0 text-xs font-black text-slate-900 dark:text-white">
                                  {click.clickCount}
                                  <span className="ml-1 font-semibold text-slate-400">({percent}%)</span>
                                </span>
                              </div>
                              <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                {index === 0 ? 'Leading channel' : `Rank #${index + 1}`}
                              </p>
                            </div>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${percent}%`,
                                background: `linear-gradient(90deg, ${ui.bar}, ${ui.bar}99)`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-linear-to-b from-slate-50 to-white p-4 sm:p-5 dark:border-white/10 dark:from-white/4 dark:to-transparent">
                    <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="relative mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Click distribution
                      </p>
                      <MousePointerClick className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="relative h-65 min-h-55 w-full flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            strokeOpacity={0.35}
                            className="dark:stroke-white/10"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            stroke="#94a3b8"
                            fontSize={10}
                            fontWeight={600}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            fontWeight={600}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const row = payload[0].payload as {
                                label: string
                                clickCount: number
                              }
                              return (
                                <div className="rounded-xl border border-white/10 bg-[#0d1222] px-3.5 py-2.5 text-xs shadow-xl">
                                  <p className="font-bold text-white">{row.label}</p>
                                  <p className="mt-1 font-semibold text-slate-200">
                                    Clicks: <span className="font-black text-white">{row.clickCount}</span>
                                  </p>
                                </div>
                              )
                            }}
                          />
                          <Bar dataKey="clickCount" name="Clicks" radius={[10, 10, 4, 4]} maxBarSize={48}>
                            {chartData.map((entry) => (
                              <Cell key={entry.channel} fill={entry.fill || BAR_COLORS[0]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-200 bg-linear-to-b from-slate-50/80 to-white px-6 py-12 text-center dark:border-white/10 dark:from-white/3 dark:to-transparent">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_55%)]" />
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <MousePointerClick className="h-7 w-7" />
                </div>
                <p className="relative text-sm font-bold text-slate-700 dark:text-slate-200">
                  No links have been clicked on your profile yet.
                </p>
                <p className="relative mx-auto mt-1.5 max-w-sm text-xs font-semibold text-slate-400">
                  When visitors tap your social links, counts appear here instantly over the live connection.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            <div className="z-10 mb-2 flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-center dark:border-white/10">
              <p className="text-xs font-semibold text-slate-400">
                Weekly click-throughs vs profile visits for your current card
              </p>
              <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Current card</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">{profileName}</span>
              </div>
            </div>

            {weeklyLoading && !weekly ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 py-12 text-center text-sm font-semibold text-slate-400 dark:border-white/10">
                Loading weekly engagement…
              </div>
            ) : (
              <>
                <div className="z-10 my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-br from-indigo-50/70 to-white p-4 shadow-sm dark:border-white/10 dark:from-indigo-500/10 dark:to-transparent">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Weekly Views
                      </span>
                      <span className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">
                        {totals.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-br from-emerald-50/70 to-white p-4 shadow-sm dark:border-white/10 dark:from-emerald-500/10 dark:to-transparent">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <MousePointer className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Weekly Clicks
                      </span>
                      <span className="mt-0.5 block text-xl font-black text-slate-900 dark:text-white">
                        {totals.clicks.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-br from-violet-50/70 to-white p-4 shadow-sm dark:border-white/10 dark:from-violet-500/10 dark:to-transparent">
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

                <div className="z-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
                  <div className="rounded-3xl border border-slate-200/80 bg-linear-to-b from-slate-50 to-white p-5 shadow-sm lg:col-span-8 dark:border-white/10 dark:from-white/4 dark:to-transparent">
                    <div className="mb-6 flex flex-col justify-between gap-3 text-xs font-bold text-slate-500 sm:flex-row sm:items-center">
                      <span>Weekly Frequency (Mon - Sun)</span>
                      <div className="flex flex-wrap items-center gap-4">
                        {chartType === 'area' ? (
                          <>
                            <span className="flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded bg-indigo-500" />
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
                              <span className="h-2.5 w-2.5 rounded bg-indigo-500" />
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
                              <linearGradient id="engViewsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="engClicksGrad" x1="0" y1="0" x2="0" y2="1">
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
                                if (!active || !payload?.length) return null
                                const data = payload[0].payload as {
                                  fullDay: string
                                  views: number
                                  clicks: number
                                  ctr: number
                                }
                                return (
                                  <div className="min-w-45 rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-left text-xs text-white shadow-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
                                    <p className="mb-1.5 font-black tracking-widest text-indigo-400 uppercase">
                                      {data.fullDay}
                                    </p>
                                    <div className="space-y-1">
                                      <div className="flex justify-between gap-4 font-bold">
                                        <span className="text-slate-300">Profile Views:</span>
                                        <span>{data.views}</span>
                                      </div>
                                      <div className="flex justify-between gap-4 font-bold">
                                        <span className="text-slate-300">Link Clicks:</span>
                                        <span>{data.clicks}</span>
                                      </div>
                                      <div className="border-slate-150/10 flex justify-between gap-4 border-t pt-1.5 text-[11px] font-extrabold">
                                        <span className="text-emerald-400">CTR Efficiency:</span>
                                        <span className="text-emerald-400">{data.ctr}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="views"
                              name="Views"
                              stroke={PRIMARY_COLOR}
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#engViewsGrad)"
                            />
                            <Area
                              type="monotone"
                              dataKey="clicks"
                              name="Clicks"
                              stroke="#10b981"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#engClicksGrad)"
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
                              stroke={PRIMARY_COLOR}
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
                                if (!active || !payload?.length) return null
                                const data = payload[0].payload as {
                                  fullDay: string
                                  views: number
                                  ctr: number
                                }
                                return (
                                  <div className="min-w-45 rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-left text-xs text-white shadow-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
                                    <p className="mb-1.5 font-black tracking-widest text-indigo-400 uppercase">
                                      {data.fullDay}
                                    </p>
                                    <div className="space-y-1">
                                      <div className="flex justify-between gap-4 font-bold">
                                        <span className="text-slate-300">Daily Traffic:</span>
                                        <span>{data.views} views</span>
                                      </div>
                                      <div className="flex justify-between gap-4 font-bold">
                                        <span className="text-slate-300">Conversion (CTR):</span>
                                        <span className="text-blue-400">{data.ctr}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="views"
                              name="Daily Traffic"
                              stroke={PRIMARY_COLOR}
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

                  <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-linear-to-b from-slate-50 to-white p-6 shadow-sm lg:col-span-4 dark:border-white/10 dark:from-white/4 dark:to-transparent">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Acoustic Insights</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {avgCtr >= 35 ? (
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                              <TrendingDown className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-[12.5px] font-extrabold text-slate-900 dark:text-white">
                              {avgCtr >= 35 ? 'High Conversion Velocity' : 'Moderate CTA Attraction'}
                            </h4>
                            <p className="mt-1 text-[11px] leading-relaxed font-semibold text-slate-400">
                              {avgCtr >= 35
                                ? `${profileName}'s digital card is converting traffic at an exceptionally efficient rate. Visitors are actively clicking social outgoing links.`
                                : `The card is capturing visual attention but link clicks are hovering around average. Try placing primary contact channels or action buttons at the top layout.`}
                            </p>
                          </div>
                        </div>

                        {peakDay && peakDay.views + peakDay.clicks > 0 ? (
                          <div className="flex gap-2 rounded-xl border border-indigo-200/80 bg-indigo-500/5 p-3 text-[11px] leading-relaxed font-semibold text-indigo-800 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                            <span>
                              {peakDay.fullDay} is the highest activity day this week, with {peakDay.views} views and{' '}
                              {peakDay.clicks} link clicks.
                            </span>
                          </div>
                        ) : (
                          <div className="flex gap-2 rounded-xl border border-indigo-200/80 bg-indigo-500/5 p-3 text-[11px] leading-relaxed font-semibold text-indigo-800 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                            <span>
                              No engagement recorded for this week yet. Share your vCard to start seeing weekly trends.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
