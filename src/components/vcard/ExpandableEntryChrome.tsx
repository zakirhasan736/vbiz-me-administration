'use client'

import { cn } from '@/utils/cn'
import { ChevronDown, Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

type AccentBadge = {
  border: string
  bg: string
  text: string
  chevronOpen?: string
  cardExpandedBorder?: string
}

const defaultAccent: AccentBadge = {
  border: 'border-cyan-100 dark:border-cyan-500/20',
  bg: 'bg-cyan-50 dark:bg-cyan-500/10',
  text: 'text-cyan-600 dark:text-cyan-400',
  chevronOpen: 'text-cyan-500',
  cardExpandedBorder: 'border-cyan-200/60 dark:border-cyan-500/20',
}

export function expandableCardClassName(isExpanded: boolean, accent: AccentBadge = defaultAccent) {
  return cn(
    'group/card overflow-hidden rounded-4xl border bg-slate-50/50 shadow-sm transition-all dark:bg-white/2',
    isExpanded
      ? (accent.cardExpandedBorder ?? 'border-cyan-200/60 dark:border-cyan-500/20')
      : 'border-transparent hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5'
  )
}

type ExpandableEntryHeaderProps = {
  indexLabel: number | string
  title: string
  subtitle?: string | null
  isExpanded: boolean
  onToggle: () => void
  onRemove?: () => void
  showRemove?: boolean
  accent?: AccentBadge
  trailing?: ReactNode
}

export function ExpandableEntryHeader({
  indexLabel,
  title,
  subtitle,
  isExpanded,
  onToggle,
  onRemove,
  showRemove = false,
  accent = defaultAccent,
  trailing,
}: ExpandableEntryHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200/50 px-2 py-2 sm:px-4 dark:border-white/5">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-expanded={isExpanded}
        className="cursor-inherit flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-slate-100/70 sm:gap-4 sm:px-4 dark:hover:bg-white/5"
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border font-black shadow-sm',
            accent.border,
            accent.bg,
            accent.text
          )}
        >
          {indexLabel}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[16px] font-black text-slate-900 dark:text-white">{title}</h4>
          {!isExpanded && subtitle ? (
            <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300',
            isExpanded && cn('rotate-180', accent.chevronOpen ?? 'text-cyan-500')
          )}
          aria-hidden
        />
      </div>
      {trailing}
      {showRemove && onRemove ? (
        <button
          type="button"
          data-no-dnd
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="mr-2 flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 font-bold text-red-500 opacity-100 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 sm:px-4 sm:opacity-0 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
          title="Remove Entry"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Remove</span>
        </button>
      ) : null}
    </div>
  )
}

type ExpandableEntryBodyProps = {
  isExpanded: boolean
  children: ReactNode
  className?: string
}

export function ExpandableEntryBody({ isExpanded, children, className }: ExpandableEntryBodyProps) {
  // Skip height transition on first paint so mount/remount does not replay open animation.
  const [transitionReady, setTransitionReady] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setTransitionReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={cn(
        'grid',
        transitionReady && 'transition-[grid-template-rows] duration-300 ease-in-out',
        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn(className, !isExpanded && 'pointer-events-none invisible')} aria-hidden={!isExpanded}>
          {children}
        </div>
      </div>
    </div>
  )
}

export const bottomAddButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-[14px] border border-black/5 bg-white px-6 py-3.5 text-[13px] font-bold shadow-sm transition-all hover:bg-slate-200 active:scale-95 sm:w-auto dark:border-white/5 dark:bg-[#0b0f19]'
