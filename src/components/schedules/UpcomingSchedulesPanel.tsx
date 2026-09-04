'use client'

import { meetLinkLabel } from '@/lib/scheduleMeetingNotifications'
import { cn } from '@/utils/cn'
import { Calendar, Clock, ExternalLink } from 'lucide-react'

export type UpcomingScheduleItem = {
  id: string
  host: string
  type: string
  date: string
  time: string
  startsAt?: string
  status: string
  meetLink?: string | null
  scope?: string
  profileId?: string | null
  kind?: 'meeting' | 'work_note'
  title?: string
}

type UpcomingSchedulesPanelProps = {
  meetings: UpcomingScheduleItem[]
  isLoading?: boolean
  title?: string
  subtitle?: string
  emptyMessage?: string
  className?: string
  compact?: boolean
  onViewAll?: () => void
}

function formatMeetingWhen(meeting: UpcomingScheduleItem) {
  return `${meeting.date} · ${meeting.time}`
}

export function UpcomingSchedulesPanel({
  meetings,
  isLoading = false,
  title = 'Upcoming sessions',
  subtitle = 'Latest scheduled events from the admin calendar.',
  emptyMessage = 'No upcoming sessions scheduled yet.',
  className,
  compact = false,
  onViewAll,
}: UpcomingSchedulesPanelProps) {
  const upcoming = meetings
    .filter((m) => {
      if (m.kind === 'work_note') return m.status !== 'complete'
      return m.status === 'Scheduled'
    })
    .slice(0, compact ? 3 : 5)

  return (
    <section
      className={cn(
        'overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1018]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-teal-700 uppercase dark:text-teal-300">
            <Calendar className="h-3.5 w-3.5" /> Schedules
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
          {!compact && subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-semibold tracking-wide text-teal-700 uppercase hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
          >
            View all
          </button>
        ) : null}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {isLoading ? (
          Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 px-5 py-4">
              <div className="h-4 w-2/3 rounded-lg bg-slate-100 dark:bg-white/10" />
              <div className="h-3 w-1/2 rounded-lg bg-slate-100 dark:bg-white/10" />
            </div>
          ))
        ) : upcoming.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm font-medium text-slate-400">{emptyMessage}</p>
        ) : (
          upcoming.map((meeting) => {
            const linkLabel = meetLinkLabel(meeting.meetLink)
            const isNote = meeting.kind === 'work_note'
            const scope = meeting.scope ?? (meeting.profileId ? 'one_to_one' : 'global')
            return (
              <article key={`${meeting.kind || 'meeting'}-${meeting.id}`} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {isNote ? meeting.title || meeting.type : meeting.type}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {isNote
                        ? `Work note · ${meeting.host}`
                        : `${
                            scope === 'global'
                              ? 'Global session'
                              : scope === 'group'
                                ? 'Group session'
                                : 'One-to-one session'
                          } · with ${meeting.host}`}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {formatMeetingWhen(meeting)}
                    </p>
                  </div>
                  {meeting.meetLink ? (
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-teal-200/80 bg-teal-50 px-2.5 py-1.5 text-[10px] font-semibold text-teal-800 uppercase dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-200"
                    >
                      <ExternalLink className="h-3 w-3" /> {linkLabel}
                    </a>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
