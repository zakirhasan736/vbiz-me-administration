'use client'

import { cardTimestampsEqual, formatCardDateTime, formatCardTimestampLabel } from '@/lib/formatCardTimestamps'
import { cn } from '@/utils/cn'
import { Clock3 } from 'lucide-react'

type VCardCardTimestampsProps = {
  createdAt?: string | null
  updatedAt?: string | null
  className?: string
}

/**
 * Compact created / updated row for dashboard & admin card list items.
 * Placed under name / company so owners can scan when a card was made and last changed.
 */
export function VCardCardTimestamps({ createdAt, updatedAt, className }: VCardCardTimestampsProps) {
  const createdLabel = formatCardTimestampLabel(createdAt)
  const updatedLabel = formatCardTimestampLabel(updatedAt)
  if (!createdLabel && !updatedLabel) return null

  const sameMoment = cardTimestampsEqual(createdAt, updatedAt)
  const showUpdated = Boolean(updatedLabel && (!sameMoment || !createdLabel))

  return (
    <div
      className={cn(
        'mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500',
        className
      )}
      title={[
        createdAt ? `Created ${formatCardDateTime(createdAt)}` : '',
        updatedAt ? `Updated ${formatCardDateTime(updatedAt)}` : '',
      ]
        .filter(Boolean)
        .join(' · ')}
    >
      <Clock3 className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      {createdLabel ? (
        <span>
          <span className="font-bold text-slate-500 uppercase dark:text-slate-400">Created</span>
          <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
          <span className="text-slate-500 tabular-nums dark:text-slate-400">{createdLabel}</span>
        </span>
      ) : null}
      {createdLabel && showUpdated ? (
        <span className="text-slate-300 dark:text-slate-600" aria-hidden>
          ·
        </span>
      ) : null}
      {showUpdated ? (
        <span>
          <span className="font-bold text-slate-500 uppercase dark:text-slate-400">Updated</span>
          <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
          <span className="text-slate-500 tabular-nums dark:text-slate-400">{updatedLabel}</span>
        </span>
      ) : null}
    </div>
  )
}
