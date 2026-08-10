'use client'

import { CorporateWeeklyEngagement } from '@/components/dashboard/corporate/CorporateWeeklyEngagement'
import {
  useGetConsolidatedEngagementQuery,
  type ConsolidatedEngagementSeries,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type CorporateEngagementSectionProps = {
  cards?: VCardRecord[]
}

const FALLBACK_COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#94a3b8']

function seriesColor(series: ConsolidatedEngagementSeries, index: number): string {
  return series.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function gradientId(key: string, index: number): string {
  return `corpConsGrad_${index}_${key.replace(/[^a-zA-Z0-9]/g, '_')}`
}

export function CorporateEngagementSection({ cards = [] }: CorporateEngagementSectionProps) {
  const [tab, setTab] = useState<'consolidated' | 'weekly'>('consolidated')
  const { data: consolidated, isLoading: consolidatedLoading } = useGetConsolidatedEngagementQuery(undefined, {
    skip: tab !== 'consolidated',
  })

  const chartSeries = useMemo(() => consolidated?.series ?? [], [consolidated?.series])
  const chartData = useMemo(() => consolidated?.months ?? [], [consolidated?.months])
  const hasSeries = chartSeries.length > 0
  const hasAnyViews = chartData.some((row) => Number(row.total) > 0)

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
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
                  Aggregated visitor views split across card-owner designations
                </p>
              </div>
              {hasSeries ? (
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                  {chartSeries.map((s, index) => (
                    <span key={s.key} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seriesColor(s, index) }} />
                      {s.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {consolidatedLoading && !consolidated ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 py-16 text-center text-sm font-semibold text-slate-400 dark:border-white/10">
                Loading consolidated engagement…
              </div>
            ) : !hasSeries || !hasAnyViews ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 py-16 text-center dark:border-white/10">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No designation views yet</p>
                <p className="mx-auto mt-1.5 max-w-sm text-xs font-semibold text-slate-400">
                  When visitors view directory cards, monthly totals appear here grouped by each card owner&apos;s
                  designation.
                </p>
              </div>
            ) : (
              <div className="h-70 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      {chartSeries.map((s, index) => {
                        const color = seriesColor(s, index)
                        const id = gradientId(s.key, index)
                        return (
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        )
                      })}
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
                    <Tooltip
                      cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="min-w-55 rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-left shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b0f19]/95">
                            <p className="mb-2.5 text-[11px] font-black tracking-widest text-indigo-400 uppercase">
                              {label} Consolidated Views
                            </p>
                            <div className="space-y-2">
                              {payload.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: String(entry.color || entry.stroke) }}
                                    />
                                    {entry.name}
                                  </span>
                                  <span className="font-extrabold text-white">
                                    {Number(entry.value || 0).toLocaleString()} views
                                  </span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-xs">
                                <span className="font-bold text-slate-500">Total Month Views:</span>
                                <span className="font-black text-indigo-400">
                                  {payload.reduce((acc, cur) => acc + (Number(cur.value) || 0), 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }}
                    />
                    {chartSeries.map((s, index) => {
                      const color = seriesColor(s, index)
                      return (
                        <Area
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={s.label}
                          stroke={color}
                          strokeWidth={3}
                          fill={`url(#${gradientId(s.key, index)})`}
                          activeDot={{ r: 6 }}
                        />
                      )
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            <CorporateWeeklyEngagement vCardsList={cards} aggregateAll embedded active={tab === 'weekly'} />
          </div>
        )}
      </div>
    </div>
  )
}
