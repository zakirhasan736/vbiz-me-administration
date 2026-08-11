'use client'

import { EngagementAnalyticsSection } from '@/components/dashboard/home/EngagementAnalyticsSection'
import { useGetDashboardStatsQuery, type DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type SeedChannel = {
  channel: DashboardSocialChannel
  label: string
  count: number
  trendPercent: number
}

type CorporateEngagementSectionProps = {
  socialChannels?: SeedChannel[]
}

export function CorporateEngagementSection({ socialChannels }: CorporateEngagementSectionProps) {
  const [tab, setTab] = useState<'consolidated' | 'weekly'>('consolidated')
  const { data: stats } = useGetDashboardStatsQuery({ period: '90' })

  const chartData = useMemo(() => {
    const points = stats?.visitsChart?.points ?? []
    return points.map((p) => ({ name: p.name, Views: p.total }))
  }, [stats?.visitsChart?.points])

  const liveChannels = socialChannels?.length ? socialChannels : stats?.socialChannels

  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
      <div className="border-b border-slate-100 px-5 pt-5 pb-0 sm:px-8 sm:pt-6 dark:border-white/5">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Engagement Analytics</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Organization-wide totals — open a card for per-profile weekly charts
            </p>
          </div>
          <div className="inline-flex self-start rounded-2xl border border-slate-200/80 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab('consolidated')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-black tracking-wider uppercase transition-all',
                tab === 'consolidated'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Consolidated
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
        {tab === 'consolidated' ? (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Consolidated Engagement Activity
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  Live visitor views across your organization cards (last 90 days)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Views
                </span>
                <span className="text-slate-400">
                  Total {(stats?.visitsChart?.total ?? stats?.totalViews ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCorpViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#e2e8f0"
                    strokeOpacity={0.3}
                    className="dark:stroke-white/5"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                    dx={-10}
                  />
                  <Tooltip />
                  <Area type="monotone" dataKey="Views" stroke="#4f46e5" strokeWidth={3} fill="url(#colorCorpViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in -m-5 duration-200 sm:-m-8">
            <EngagementAnalyticsSection socialChannels={liveChannels} />
          </div>
        )}
      </div>
    </div>
  )
}
