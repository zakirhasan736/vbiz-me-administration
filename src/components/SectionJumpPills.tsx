'use client'

import { cn } from '@/utils/cn'

export type JumpPill = {
  id: string | number
  title: string
  detail?: string
}

type Props = {
  items: JumpPill[]
  accent?: 'teal' | 'indigo' | 'amber' | 'violet' | 'cyan' | 'orange' | 'purple'
  label?: string
}

const accents = {
  teal: 'hover:border-teal-400/60 hover:bg-teal-50/80 dark:hover:bg-teal-500/10 text-teal-700 dark:text-teal-300',
  indigo:
    'hover:border-indigo-400/60 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  amber: 'hover:border-amber-400/60 hover:bg-amber-50/80 dark:hover:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  violet:
    'hover:border-violet-400/60 hover:bg-violet-50/80 dark:hover:bg-violet-500/10 text-violet-700 dark:text-violet-300',
  cyan: 'hover:border-cyan-400/60 hover:bg-cyan-50/80 dark:hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  orange:
    'hover:border-orange-400/60 hover:bg-orange-50/80 dark:hover:bg-orange-500/10 text-orange-700 dark:text-orange-300',
  purple:
    'hover:border-purple-400/60 hover:bg-purple-50/80 dark:hover:bg-purple-500/10 text-purple-700 dark:text-purple-300',
}

/** Compact grid of jump pills (3–5 per row) under section banners */
export function SectionJumpPills({ items, accent = 'indigo', label = 'Jump to entry' }: Props) {
  if (items.length < 2) return null

  const jump = (id: string | number) => {
    const el = document.getElementById(`entry-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-400/60')
    window.setTimeout(() => {
      el.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-400/60')
    }, 1400)
  }

  return (
    <div className="mb-5 space-y-2" data-tour="jump-pills">
      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{label}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => jump(item.id)}
            title={item.detail || item.title}
            className={cn(
              'min-w-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-left shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]',
              accents[accent]
            )}
          >
            <span className="block text-[10px] font-black text-slate-400 tabular-nums">#{i + 1}</span>
            <span className="block truncate text-[11px] leading-tight font-bold text-slate-800 dark:text-slate-100">
              {item.title || `Item ${i + 1}`}
            </span>
            {item.detail ? (
              <span className="mt-0.5 block truncate text-[9px] font-semibold text-slate-400">{item.detail}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
