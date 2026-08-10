'use client'

import { useGetWeeklyEngagementQuery } from '@/redux/features/profiles/profiles.api'
import { useMemo } from 'react'

const FALLBACK_DAYS = [
  { day: 'Mon', views: 0 },
  { day: 'Tue', views: 0 },
  { day: 'Wed', views: 0 },
  { day: 'Thu', views: 0 },
  { day: 'Fri', views: 0 },
  { day: 'Sat', views: 0 },
  { day: 'Sun', views: 0 },
]

export function TrafficSparkline({ profileId, slug }: { profileId: string; slug: string }) {
  const { data: weekly, isFetching } = useGetWeeklyEngagementQuery({ profileId }, { skip: !profileId })

  const data = useMemo(() => {
    const days = weekly?.days?.length ? weekly.days : FALLBACK_DAYS
    return days.map((d) => ({ day: d.day, views: Number(d.views) || 0 }))
  }, [weekly?.days])

  const weekViews = weekly?.totals?.views ?? data.reduce((sum, d) => sum + d.views, 0)

  const points = data.map((d) => d.views)
  const max = Math.max(...points, 5)
  const min = 0
  const range = max - min || 1

  const svgWidth = 160
  const svgHeight = 45
  const padding = 4

  const coords = points.map((val, i) => {
    const x = padding + (i / 6) * (svgWidth - padding * 2)
    const y = svgHeight - padding - ((val - min) / range) * (svgHeight - padding * 2)
    return { x, y }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${coords[6]!.x.toFixed(1)} ${svgHeight} L ${coords[0]!.x.toFixed(1)} ${svgHeight} Z`
  const gradId = `grad-${slug || profileId || 'card'}`

  return (
    <div className="animate-in fade-in zoom-in-95 relative z-50 w-48 rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-xl duration-150 dark:border-white/10 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">7-Day Traffic</span>
        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-500 dark:bg-indigo-500/10">
          {isFetching && !weekly ? '…' : `+${weekViews} Views`}
        </span>
      </div>

      <div className={`relative mb-2 flex h-12 items-end justify-center ${isFetching && !weekly ? 'opacity-50' : ''}`}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r="2"
              className="fill-indigo-600 stroke-white stroke-2 dark:fill-indigo-400 dark:stroke-slate-900"
            >
              <title>{`${data[i]!.day}: ${data[i]!.views} views`}</title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="flex justify-between border-t border-slate-100 px-0.5 pt-1.5 text-[8px] font-black tracking-widest text-slate-400 uppercase dark:border-white/5">
        {data.map((d, i) => (
          <span key={i} title={`${d.views} views`}>
            {d.day[0]}
          </span>
        ))}
      </div>
    </div>
  )
}
