'use client'

import { UpcomingSchedulesPanel } from '@/components/schedules/UpcomingSchedulesPanel'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGetCrmDashboardQuery, useGetCrmScheduleCalendarQuery, type WorkNoteRow } from '@/redux/features/crm/crm.api'
import { cn } from '@/utils/cn'
import { AlertTriangle, Bell, CalendarDays, ClipboardList, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'

type CrmHomeDashboardProps = {
  onOpenTab: (tab: 'leads' | 'calendar' | 'work_notes') => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  date.setDate(date.getDate() - date.getDay())
  return date
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function statusLabel(status: WorkNoteRow['status']) {
  switch (status) {
    case 'not_started':
      return 'Not started'
    case 'in_progress':
      return 'In progress'
    case 'in_review':
      return 'In review'
    case 'complete':
      return 'Complete'
    default:
      return status
  }
}

export function CrmHomeDashboard({ onOpenTab }: CrmHomeDashboardProps) {
  const { data: dashboard, isLoading } = useGetCrmDashboardQuery()
  const [weekAnchor] = useState(() => startOfWeek(new Date()))

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekAnchor)
      date.setDate(weekAnchor.getDate() + i)
      return { key: toIsoDate(date), day: date.getDate(), weekday: WEEKDAYS[date.getDay()]! }
    })
  }, [weekAnchor])

  const weekFrom = weekDays[0]?.key ?? toIsoDate(new Date())
  const weekTo = weekDays[6]?.key ?? weekFrom
  const todayKey = toIsoDate(new Date())

  const { data: weekCalendar, isLoading: weekLoading } = useGetCrmScheduleCalendarQuery({
    from: weekFrom,
    to: weekTo,
  })

  const weekItems = useMemo(() => weekCalendar?.items ?? [], [weekCalendar?.items])
  const countsByDay = useMemo(() => {
    const map = new Map<string, { meetings: number; notes: number }>()
    for (const item of weekItems) {
      const key = (item.date || item.startsAt || '').slice(0, 10)
      if (!key) continue
      const prev = map.get(key) ?? { meetings: 0, notes: 0 }
      if (item.kind === 'work_note') prev.notes += 1
      else prev.meetings += 1
      map.set(key, prev)
    }
    return map
  }, [weekItems])

  const upcomingSchedules = useMemo(() => {
    return [...weekItems]
      .filter((item) => {
        const day = (item.date || item.startsAt || '').slice(0, 10)
        if (!day || day < todayKey) return false
        if (item.kind === 'work_note') return item.status !== 'complete'
        return item.status === 'Scheduled'
      })
      .sort((a, b) => String(a.startsAt || a.date).localeCompare(String(b.startsAt || b.date)))
      .slice(0, 5)
  }, [weekItems, todayKey])

  const upcomingWork = dashboard?.upcomingWorkNotes ?? []
  const overdueWork = dashboard?.overdueWorkNotes ?? []
  const overdueCount = dashboard?.metrics.workNotesOverdue ?? overdueWork.length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-36 rounded-[28px]" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-[28px]" />
          <Skeleton className="h-64 rounded-[28px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {overdueCount > 0 ? (
        <button
          type="button"
          onClick={() => onOpenTab('work_notes')}
          className="flex w-full items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-left transition hover:border-rose-300 dark:border-rose-500/30 dark:bg-rose-500/10 dark:hover:border-rose-500/50"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <Bell className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-rose-800 dark:text-rose-200">
              {overdueCount} overdue work note{overdueCount === 1 ? '' : 's'}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-rose-700/80 dark:text-rose-300/80">
              Past due and still open — open the board to catch up.
            </span>
          </span>
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Total leads" value={dashboard?.metrics.openLeads} onClick={() => onOpenTab('leads')} />
        <MetricCard label="Leads this week" value={dashboard?.metrics.newLeads} onClick={() => onOpenTab('leads')} />
        <MetricCard
          label="Work notes"
          value={dashboard?.metrics.workNotesTotal}
          hint={
            typeof dashboard?.metrics.workNotesOpen === 'number' ? `${dashboard.metrics.workNotesOpen} open` : undefined
          }
          onClick={() => onOpenTab('work_notes')}
        />
        <MetricCard
          label="Upcoming"
          value={dashboard?.metrics.upcomingMeetings}
          onClick={() => onOpenTab('calendar')}
        />
        <MetricCard
          label="Overdue"
          value={dashboard?.metrics.workNotesOverdue}
          accent={Boolean(dashboard?.metrics.workNotesOverdue)}
          onClick={() => onOpenTab('work_notes')}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f15]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-teal-600 uppercase">This week</p>
            <h2 className="mt-1 text-sm font-black text-slate-900 dark:text-white">Schedule snapshot</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenTab('calendar')}
            className="text-[10px] font-black tracking-wider text-indigo-600 uppercase"
          >
            Full calendar
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((day) => {
            const counts = countsByDay.get(day.key)
            const isToday = day.key === todayKey
            const total = (counts?.meetings ?? 0) + (counts?.notes ?? 0)
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onOpenTab('calendar')}
                className={cn(
                  'flex flex-col items-center rounded-2xl border px-1 py-2.5 transition sm:px-2',
                  isToday
                    ? 'border-teal-300 bg-teal-50 dark:border-teal-500/40 dark:bg-teal-500/10'
                    : 'border-slate-100 bg-slate-50/80 hover:border-slate-200 dark:border-white/5 dark:bg-white/3 dark:hover:border-white/10'
                )}
              >
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">{day.weekday}</span>
                <span
                  className={cn(
                    'mt-1 text-sm font-black',
                    isToday ? 'text-teal-800 dark:text-teal-200' : 'text-slate-800 dark:text-white'
                  )}
                >
                  {day.day}
                </span>
                <span className="mt-1.5 flex h-3 items-center gap-0.5">
                  {weekLoading ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-200 dark:bg-white/20" />
                  ) : total > 0 ? (
                    <>
                      {(counts?.meetings ?? 0) > 0 ? <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> : null}
                      {(counts?.notes ?? 0) > 0 ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> : null}
                    </>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                  )}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] font-medium text-slate-400">
          <span className="mr-3 inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Meetings
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Work notes
          </span>
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingSchedulesPanel
          meetings={upcomingSchedules}
          isLoading={weekLoading}
          compact
          title="Upcoming schedule"
          emptyMessage="Nothing booked this week. Open Schedules to book."
          onViewAll={() => onOpenTab('calendar')}
        />

        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-indigo-600 uppercase dark:text-indigo-300">
                <ClipboardList className="h-3.5 w-3.5" /> Work
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">Upcoming work notes</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenTab('work_notes')}
              className="shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-semibold tracking-wide text-indigo-600 uppercase hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            >
              Board
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {overdueWork.length > 0 ? (
              <div className="space-y-2 px-5 py-4">
                <p className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-rose-600 uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" /> Delayed / overdue
                </p>
                {overdueWork.map((note) => (
                  <WorkNoteLine key={note.id} note={note} overdue />
                ))}
              </div>
            ) : null}

            {upcomingWork.length === 0 && overdueWork.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <ClipboardList className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-400">No upcoming work. Create a note on the board.</p>
              </div>
            ) : upcomingWork.length > 0 ? (
              <div className="space-y-2 px-5 py-4">
                {overdueWork.length > 0 ? (
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Due soon</p>
                ) : null}
                {upcomingWork.map((note) => (
                  <WorkNoteLine key={note.id} note={note} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickAction label="Add lead" icon={UserPlus} onClick={() => onOpenTab('leads')} />
        <QuickAction label="Book session" icon={CalendarDays} onClick={() => onOpenTab('calendar')} />
        <QuickAction label="New work note" icon={ClipboardList} onClick={() => onOpenTab('work_notes')} />
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  onClick,
  accent,
  className,
}: {
  label: string
  value?: number
  hint?: string
  onClick?: () => void
  accent?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left transition hover:border-indigo-300 dark:hover:border-indigo-500/40',
        accent
          ? 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
          : 'border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0b0f19]',
        className
      )}
    >
      <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : '—'}
      </p>
      {hint ? <p className="mt-1 text-[10px] font-semibold text-slate-400">{hint}</p> : null}
    </button>
  )
}

function WorkNoteLine({ note, overdue }: { note: WorkNoteRow; overdue?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-3 py-2.5',
        overdue
          ? 'border-rose-200 bg-rose-50/80 dark:border-rose-500/20 dark:bg-rose-500/10'
          : 'border-slate-100 dark:border-white/5'
      )}
    >
      <p className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">
        {note.assigneeName || 'Unassigned'} · {statusLabel(note.status)} · due {formatWhen(note.dueAt)}
      </p>
    </div>
  )
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: typeof UserPlus; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black tracking-wider text-slate-700 uppercase dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-200"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}
