'use client'

import { cardTimestampsEqual, formatCardDateTime, formatCardTimestampLabel } from '@/lib/formatCardTimestamps'
import { cn } from '@/utils/cn'
import { Clock3 } from 'lucide-react'

type VCardCardTimestampsProps = {
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  className?: string
}

function toIso(value?: string | Date | null): string {
  if (!value) return ''
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  }
  if (typeof value === 'string') return value.trim()
  return ''
}

/**
 * Compact created / updated row for dashboard & admin card list items.
 * Placed under name / company so owners can scan when a card was made and last changed.
 */
export function VCardCardTimestamps({ createdAt, updatedAt, className }: VCardCardTimestampsProps) {
  const createdIso = toIso(createdAt)
  const updatedIso = toIso(updatedAt)
  const createdLabel = formatCardTimestampLabel(createdIso)
  const updatedLabel = formatCardTimestampLabel(updatedIso)
  if (!createdLabel && !updatedLabel) return null

  const sameMoment = cardTimestampsEqual(createdIso, updatedIso)
  const showUpdated = Boolean(updatedLabel && (!sameMoment || !createdLabel))

  return (
    <div
      className={cn(
        'mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500',
        className
      )}
      title={[
        createdIso ? `Created ${formatCardDateTime(createdIso)}` : '',
        updatedIso ? `Updated ${formatCardDateTime(updatedIso)}` : '',
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
