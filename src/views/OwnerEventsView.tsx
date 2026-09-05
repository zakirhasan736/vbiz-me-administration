'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { OneOnOneRequestsPanel } from '@/components/admin/OneOnOneRequestsPanel'
import { UpcomingSchedulesPanel } from '@/components/schedules/UpcomingSchedulesPanel'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import {
  buildMonthCells,
  formatDayHeading,
  meetingDayKey,
  meetingsByDayMap,
  monthRangeIso,
  monthTitle,
  pinTone,
  SCHEDULE_WEEKDAYS,
  todayIsoDate,
  type CalendarCell,
} from '@/lib/scheduleCalendar'
import { meetLinkLabel } from '@/lib/scheduleMeetingNotifications'
import { useGetOwnerMeetingsQuery } from '@/redux/features/meetings/meetings.api'
import { useGetProfilesQuery } from '@/redux/features/profiles/profiles.api'
import type { Meeting } from '@/types/meeting'
import { cn } from '@/utils/cn'
import { ChevronLeft, ChevronRight, Clock, ExternalLink, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type OwnerEventsViewProps = {
  initialProfileId?: string | null
}

function meetingScopeLabel(meeting: Meeting) {
  const scope = meeting.scope ?? (meeting.profileId ? 'one_to_one' : 'global')
  if (scope === 'global') return 'Global'
  if (scope === 'group') return 'Group'
  return 'One-to-one'
}

export default function OwnerEventsView({ initialProfileId = null }: OwnerEventsViewProps) {
  const now = new Date()
  const { isCorporateBackOffice } = useOwnerMode()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileFilter, setProfileFilter] = useState(initialProfileId ?? '')

  const monthRange = useMemo(() => monthRangeIso(viewYear, viewMonth), [viewYear, viewMonth])

  const { data: profilesPage } = useGetProfilesQuery({ limit: 100, skip: 0 }, { skip: !isCorporateBackOffice })
  const profileOptions = profilesPage?.items ?? []

  const { data, isLoading, isError } = useGetOwnerMeetingsQuery({
    from: monthRange.from,
    to: monthRange.to,
    limit: 100,
    profileId: profileFilter || undefined,
  })

  const { data: upcomingPage, isLoading: upcomingLoading } = useGetOwnerMeetingsQuery({
    upcomingOnly: true,
    limit: 20,
    profileId: profileFilter || undefined,
  })

  const meetings = data?.items ?? []
  const filteredMeetings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return meetings
    return meetings.filter(
      (m) =>
        m.host.toLowerCase().includes(q) ||
        String(m.type).toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q) ||
        (m.notes || '').toLowerCase().includes(q) ||
        meetingDayKey(m).includes(q)
    )
  }, [meetings, searchQuery])

  const meetingsByDay = useMemo(() => meetingsByDayMap(filteredMeetings), [filteredMeetings])
  const monthCells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth])
  const todayKey = todayIsoDate()
  const selectedMeetings = selectedDay ? meetingsByDay.get(selectedDay) || [] : []

  const upcomingMeetings = useMemo(
    () => (upcomingPage?.items ?? []).filter((m) => m.status === 'Scheduled'),
    [upcomingPage?.items]
  )

  const monthMeetingCount = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    return filteredMeetings.filter((m) => meetingDayKey(m).startsWith(prefix)).length
  }, [filteredMeetings, viewYear, viewMonth])

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const handleDayClick = (cell: CalendarCell) => {
    const items = meetingsByDay.get(cell.key) || []
    if (items.length) setSelectedDay(cell.key)
  }

  return (
    <div className="animate-in fade-in relative mx-auto max-w-7xl space-y-6 duration-500">
      <header className="flex flex-col gap-4 border-b border-slate-200/70 pb-6 md:flex-row md:items-end md:justify-between dark:border-white/10">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-teal-700 uppercase dark:text-teal-300">
            Events
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Your schedule
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            View platform-wide sessions, one-to-one calls, and team group meetings on the calendar. Global, group, and
            card-specific events appear here.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#0d121c]/90">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by session type, host, notes, or date…"
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none dark:text-white"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {isCorporateBackOffice ? (
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none dark:border-white/10 dark:bg-[#0d121c] dark:text-white"
            >
              <option value="">All team cards</option>
              {profileOptions.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name?.trim() || profile.slug || profile.id}
                </option>
              ))}
            </select>
          ) : null}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-[#0d121c]/90 dark:text-slate-400">
            {monthMeetingCount} this month · {filteredMeetings.length} visible
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-white/5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                {monthTitle(viewYear, viewMonth)}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tap a day with events to see details.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  setViewYear(today.getFullYear())
                  setViewMonth(today.getMonth())
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-bold tracking-wide text-slate-600 uppercase dark:border-white/10 dark:text-slate-300"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 dark:border-white/5 dark:bg-white/2">
            {SCHEDULE_WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {isLoading ? (
              Array.from({ length: 42 }).map((_, index) => (
                <div
                  key={index}
                  className="min-h-24 animate-pulse border-r border-b border-slate-100 bg-slate-50/40 dark:border-white/5"
                />
              ))
            ) : isError ? (
              <div className="col-span-7 py-16 text-center text-sm font-semibold text-rose-500">
                Failed to load your events.
              </div>
            ) : (
              monthCells.map((cell) => {
                const dayMeetings = meetingsByDay.get(cell.key) || []
                const isToday = cell.key === todayKey
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => handleDayClick(cell)}
                    className={cn(
                      'min-h-24 border-r border-b border-slate-100 p-2 text-left transition hover:bg-teal-50/40 dark:border-white/5 dark:hover:bg-teal-500/5',
                      !cell.inMonth && 'bg-slate-50/50 opacity-50 dark:bg-white/2',
                      dayMeetings.length > 0 && 'cursor-pointer',
                      dayMeetings.length === 0 && 'cursor-default'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                        isToday
                          ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-200'
                      )}
                    >
                      {cell.day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayMeetings.slice(0, 2).map((meeting) => (
                        <div
                          key={meeting.id}
                          className="truncate rounded-md border border-teal-200/70 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-900 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-100"
                        >
                          {meeting.type}
                        </div>
                      ))}
                      {dayMeetings.length > 2 ? (
                        <p className="text-[10px] font-semibold text-slate-400">+{dayMeetings.length - 2} more</p>
                      ) : null}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <UpcomingSchedulesPanel
          meetings={upcomingMeetings}
          isLoading={upcomingLoading}
          title="Upcoming events"
          subtitle="Your next scheduled sessions."
          emptyMessage="No upcoming events yet."
          compact
        />
      </div>

      <UpcomingSchedulesPanel
        meetings={upcomingMeetings}
        isLoading={upcomingLoading}
        title="All upcoming sessions"
        subtitle="Global platform events plus your one-to-one and group meetings."
        emptyMessage="When admin or your team books a session, it will appear here."
      />

      <OneOnOneRequestsPanel className="mt-4" />

      {selectedDay ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
              onClick={() => setSelectedDay(null)}
            />
            <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:rounded-[28px] dark:border-white/10 dark:bg-[#0b1018]">
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur dark:border-white/5 dark:bg-[#0b1018]/95">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
                      Day agenda
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {formatDayHeading(selectedDay)}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 px-6 py-5">
                {selectedMeetings.map((meeting) => {
                  const linkLabel = meetLinkLabel(meeting.meetLink)
                  return (
                    <article
                      key={meeting.id}
                      className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold tracking-[0.14em] text-teal-700 uppercase dark:text-teal-300">
                            {meetingScopeLabel(meeting)} · {meeting.type}
                          </p>
                          <h4 className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                            with {meeting.host}
                          </h4>
                        </div>
                        <span
                          className={cn(
                            'rounded-lg border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase',
                            pinTone(meeting.status)
                          )}
                        >
                          {meeting.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {meeting.time}
                      </div>
                      {meeting.notes ? (
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{meeting.notes}</p>
                      ) : null}
                      {meeting.meetLink && linkLabel ? (
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-[11px] font-bold tracking-wide text-white uppercase dark:bg-teal-500 dark:text-slate-950"
                        >
                          Join {linkLabel}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  )
}

export function OwnerEventsLink({ className }: { className?: string }) {
  return (
    <Link
      href="/events"
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-wide text-slate-700 uppercase transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b1018] dark:text-slate-200 dark:hover:bg-white/5',
        className
      )}
    >
      Open events calendar
    </Link>
  )
}
