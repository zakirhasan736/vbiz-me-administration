import React from 'react'

export function TrafficSparkline({ slug, totalViews }: { slug: string; totalViews: number }) {
  const data = React.useMemo(() => {
    let seed = 0
    const cleanSlug = slug || 'card'
    for (let i = 0; i < cleanSlug.length; i++) {
      seed += cleanSlug.charCodeAt(i)
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const points: number[] = []

    // Distribute totalViews across 7 days deterministically
    const remaining = totalViews || 14
    const factors = [0.1, 0.15, 0.08, 0.2, 0.25, 0.12, 0.1]

    const shuffledFactors = [...factors]
    for (let i = shuffledFactors.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1)
      const temp = shuffledFactors[i]
      shuffledFactors[i] = shuffledFactors[j]
      shuffledFactors[j] = temp
    }

    let sum = 0
    for (let i = 0; i < 7; i++) {
      const val = Math.max(1, Math.round(remaining * shuffledFactors[i]))
      points.push(val)
      sum += val
    }

    if (totalViews > 0 && sum !== totalViews) {
      const diff = totalViews - sum
      points[6] = Math.max(0, points[6] + diff)
    }

    return points.map((val, i) => ({ day: days[i], views: val }))
  }, [slug, totalViews])

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
  const areaPath = `${linePath} L ${coords[6].x.toFixed(1)} ${svgHeight} L ${coords[0].x.toFixed(1)} ${svgHeight} Z`

  return (
    <div className="animate-in fade-in zoom-in-95 relative z-50 w-48 rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-xl duration-150 dark:border-white/10 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">7-Day Traffic</span>
        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-500 dark:bg-indigo-500/10">
          +{totalViews || 14} Views
        </span>
      </div>

      {/* Sparkline chart */}
      <div className="relative mb-2 flex h-12 items-end justify-center">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`grad-${slug}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Fill Area */}
          <path d={areaPath} fill={`url(#grad-${slug})`} />
          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r="2"
              className="hover:r-3.5 cursor-pointer fill-indigo-600 stroke-white stroke-2 transition-all duration-150 dark:fill-indigo-400 dark:stroke-slate-900"
              aria-label={`${data[i].day}: ${data[i].views} views`}
            />
          ))}
        </svg>
      </div>

      {/* Days labels */}
      <div className="border-slate-150 flex justify-between border-t px-0.5 pt-1.5 text-[8px] font-black tracking-widest text-slate-400 uppercase dark:border-white/5">
        {data.map((d, i) => (
          <span key={i} title={`${d.views} views`}>
            {d.day[0]}
          </span>
        ))}
      </div>
    </div>
  )
}
