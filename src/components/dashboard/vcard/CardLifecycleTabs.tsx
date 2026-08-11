'use client'

import { cn } from '@/utils/cn'

export type CardLifecycleTab = 'active' | 'draft'

type CardLifecycleTabsProps = {
  value: CardLifecycleTab
  onChange: (value: CardLifecycleTab) => void
  activeCount: number
  draftCount: number
  className?: string
}

/** Active (default) / Draft switcher with counts for card directories. */
export function CardLifecycleTabs({ value, onChange, activeCount, draftCount, className }: CardLifecycleTabsProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5',
        className
      )}
      role="tablist"
      aria-label="Card status"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'active'}
        onClick={() => onChange('active')}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black tracking-wide transition-all',
          value === 'active'
            ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        )}
      >
        Active
        <span
          className={cn(
            'rounded-lg px-1.5 py-0.5 text-[10px] font-black',
            value === 'active'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-300'
          )}
        >
          {activeCount}
        </span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'draft'}
        onClick={() => onChange('draft')}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black tracking-wide transition-all',
          value === 'draft'
            ? 'bg-white text-amber-700 shadow-sm dark:bg-slate-900 dark:text-amber-300'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        )}
      >
        Draft
        <span
          className={cn(
            'rounded-lg px-1.5 py-0.5 text-[10px] font-black',
            value === 'draft'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
              : 'bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-300'
          )}
        >
          {draftCount}
        </span>
      </button>
    </div>
  )
}
