'use client'

import { StatNumber } from '@/components/ui/StatNumber'
import { Eye, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ChartPoint = { name: string; total: number }

type WebsiteVisitsChartProps = {
  points?: ChartPoint[]
  total?: number
  uniqueViews?: number
  shares?: number
  trendPercent?: number
  loading?: boolean
}

export function WebsiteVisitsChart({
  points = [],
  total,
  uniqueViews,
  shares,
  trendPercent = 0,
  loading = false,
}: WebsiteVisitsChartProps) {
  const resolvedUnique = uniqueViews ?? total

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-4xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] lg:col-span-2 dark:border-white/10 dark:bg-[#0b0f19]">
      <div className="relative z-10 flex h-full flex-col justify-between p-8 pb-0">
        <div className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400">
                <Eye className="h-5 w-5" />
              </span>
              <h2 className="pl-1 text-[13px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Website Visits
              </h2>
            </div>
            <div className="mt-2 flex items-baseline gap-4">
              <StatNumber
                value={total}
                loading={loading}
                className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white"
                skeletonClassName="h-14 w-28 rounded-xl"
              />
              <span className="flex items-center gap-1.5 rounded-[10px] border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" /> Live
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                Unique views:{' '}
                <StatNumber
                  value={resolvedUnique}
                  loading={loading}
                  className="font-bold text-slate-800 dark:text-white"
                  skeletonClassName="h-4 w-10 rounded-md"
                />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                Shares:{' '}
                <StatNumber
                  value={shares}
                  loading={loading}
                  className="font-bold text-slate-800 dark:text-white"
                  skeletonClassName="h-4 w-10 rounded-md"
                />
              </span>
              {!loading && trendPercent !== 0 && (
                <span className="text-[11px] font-bold text-slate-500">
                  Trend:{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {trendPercent > 0 ? '+' : ''}
                    {trendPercent}%
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative mt-2 -ml-4 h-65 w-full min-w-0 sm:ml-0">
          <div className="pointer-events-none absolute inset-0 top-auto bottom-0 z-10 h-8 bg-linear-to-t from-white via-transparent to-transparent dark:from-[#0b0f19]" />
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="singleViewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#e2e8f0"
                strokeOpacity={0.4}
                className="dark:stroke-white/10"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                dy={10}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                dx={-10}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{
                  stroke: '#4f46e5',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  borderColor: 'var(--tooltip-border, rgba(0,0,0,0.1))',
                  borderRadius: '16px',
                  color: '#0f172a',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  fontWeight: 600,
                  padding: '12px',
                  border: 'none',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#singleViewsGradient)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
