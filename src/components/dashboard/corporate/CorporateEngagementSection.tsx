'use client'

import { EngagementAnalyticsSection } from '@/components/dashboard/home/EngagementAnalyticsSection'
import type { DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const CORPORATE_CHART_DATA = [
  { name: 'Apr', Engineering: 45, Marketing: 25, Sales: 15 },
  { name: 'May', Engineering: 55, Marketing: 35, Sales: 20 },
  { name: 'Jun', Engineering: 70, Marketing: 45, Sales: 30 },
  { name: 'Jul', Engineering: 90, Marketing: 60, Sales: 40 },
  { name: 'Aug', Engineering: 120, Marketing: 80, Sales: 50 },
  { name: 'Sep', Engineering: 1240, Marketing: 890, Sales: 1062 },
]

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
                  Aggregated visitor views split across key organizational departments
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <div className="bg-primary-500 h-2.5 w-2.5 rounded-full" /> Engineering
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-pink-500" /> Marketing
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Sales
                </span>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CORPORATE_CHART_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="Engineering" stroke="#4f46e5" strokeWidth={3} fill="url(#colorEng)" />
                  <Area type="monotone" dataKey="Marketing" stroke="#ec4899" strokeWidth={3} fill="url(#colorMark)" />
                  <Area type="monotone" dataKey="Sales" stroke="#f59e0b" strokeWidth={3} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in -m-5 duration-200 sm:-m-8">
            <EngagementAnalyticsSection socialChannels={socialChannels} />
          </div>
        )}
      </div>
    </div>
  )
}
