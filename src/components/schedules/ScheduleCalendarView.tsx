'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import { AdminScheduleCalendarSkeleton } from '@/components/admin/AdminScheduleSkeleton'
import { OneOnOneRequestsPanel } from '@/components/admin/OneOnOneRequestsPanel'
import type { ScheduleMeetingSubmitPayload } from '@/components/admin/ScheduleMeetingModal'
import { ScheduleMeetingModal } from '@/components/admin/ScheduleMeetingModal'
import { UpcomingSchedulesPanel } from '@/components/schedules/UpcomingSchedulesPanel'
import { meetLinkLabel } from '@/lib/scheduleMeetingNotifications'
import { submitScheduleMeeting } from '@/lib/submitScheduleMeeting'
import {
  useDeleteCrmEventMutation,
  useGetCrmScheduleCalendarQuery,
  useUpdateCrmEventMutation,
  type CrmScheduleCalendarItem,
} from '@/redux/features/crm/crm.api'
import {
  useCreateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingsQuery,
  useGetOwnerMeetingsQuery,
  useUpdateMeetingMutation,
} from '@/redux/features/meetings/meetings.api'
import type { CrmEventAttachment, CrmEventStatus } from '@/types/crmEvent'
import { type Meeting, type MeetingScope, type MeetingStatus } from '@/types/meeting'
import { cn } from '@/utils/cn'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const WORK_NOTE_STATUS_LABELS: Record<string, string> = {
  not_started: 'Pending',
  in_progress: 'In progress',
  in_review: 'In review',
  complete: 'Complete',
}

function workNoteStatusLabel(status: string) {
  return WORK_NOTE_STATUS_LABELS[status] ?? status.replaceAll('_', ' ')
}

type CalendarEntry = {
  kind: 'meeting' | 'work_note' | 'event'
  id: string
  host: string
  type: string
  date: string
  time: string
  startsAt: string
  status: string
  meetLink?: string | null
  notes?: string | null
  attachments?: CrmEventAttachment[]
  scope?: MeetingScope | string
  profileId?: string | null
  canManageMeeting: boolean
  title?: string
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayIsoDate(): string {
  return toIsoDate(new Date())
}

function meetingDayKey(meeting: Pick<CalendarEntry, 'date' | 'startsAt'>): string {
  const raw = (meeting.date || meeting.startsAt || '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return toIsoDate(parsed)
}

function formatDayHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

type CalendarCell = { key: string; day: number; inMonth: boolean }

function buildMonthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return {
      key: toIsoDate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    }
  })
}

function pinTone(entry: CalendarEntry) {
  if (entry.kind === 'work_note') {
    return 'border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200'
  }
  if (entry.kind === 'event') {
    if (entry.status === 'Completed') {
      return 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
    }
    if (entry.status === 'Cancelled') {
      return 'border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
    }
    return 'border-rose-200/80 bg-rose-50 text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200'
  }
  if (entry.status === 'Completed') {
    return 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
  }
  if (entry.status === 'Cancelled') {
    return 'border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
  }
  return 'border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200'
}

function statusDot(entry: CalendarEntry) {
  if (entry.kind === 'work_note') return 'bg-amber-500'
  if (entry.kind === 'event') {
    if (entry.status === 'Completed') return 'bg-emerald-500'
    if (entry.status === 'Cancelled') return 'bg-slate-400'
    return 'bg-rose-500'
  }
  if (entry.status === 'Completed') return 'bg-emerald-500'
  if (entry.status === 'Cancelled') return 'bg-slate-400'
  return 'bg-sky-500'
}

function meetingToEntry(m: Meeting): CalendarEntry {
  return {
    kind: 'meeting',
    id: m.id,
    host: m.host,
    type: String(m.type),
    date: m.date,
    time: m.time,
    startsAt: m.startsAt,
    status: m.status,
    meetLink: m.meetLink,
    notes: m.notes,
    scope: m.scope,
    profileId: m.profileId,
    canManageMeeting: true,
    title: m.type,
  }
}

function crmItemToEntry(item: CrmScheduleCalendarItem): CalendarEntry {
  return {
    kind: item.kind,
    id: item.id,
    host: item.host,
    type: item.type,
    date: item.date,
    time: item.time,
    startsAt: item.startsAt,
    status: item.status,
    meetLink: item.meetLink,
    notes: item.notes,
    attachments: item.attachments,
    scope: item.scope,
    profileId: item.profileId,
    canManageMeeting: item.canManageMeeting,
    title: item.title,
  }
}

export type ScheduleCalendarViewProps = {
  meetingsSource?: 'admin' | 'owner' | 'crm_zoho'
  canManageMeetings?: boolean
  allowedScopes?: MeetingScope[]
  defaultScope?: MeetingScope
  title?: string
  eyebrow?: string
  subtitle?: string
  upcomingSubtitle?: string
  compact?: boolean
  cardPicker?: 'admin' | 'own'
  /** Role-scoped host search (cards + saved guests) + inline create lead. */
  personSearch?: boolean
}

export function ScheduleCalendarView({
  meetingsSource = 'admin',
  canManageMeetings = true,
  allowedScopes,
  defaultScope,
  title = 'Schedules',
  eyebrow = 'Operations',
  subtitle = 'A clear month view for onboarding calls, growth sessions, and owner discussions. Click any day to open details or book.',
  upcomingSubtitle = 'Latest scheduled sessions across the platform.',
  compact = false,
  cardPicker,
  personSearch = false,
}: ScheduleCalendarViewProps) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const monthRange = useMemo(() => {
    const cells = buildMonthCells(viewYear, viewMonth)
    return { from: cells[0]?.key, to: cells[cells.length - 1]?.key }
  }, [viewYear, viewMonth])
  const upcomingFrom = todayIsoDate()
  const isCrmZoho = meetingsSource === 'crm_zoho'

  const adminQuery = useGetMeetingsQuery(
    { limit: 100, from: monthRange.from, to: monthRange.to },
    { skip: meetingsSource !== 'admin' }
  )
  const ownerQuery = useGetOwnerMeetingsQuery(
    { limit: 100, from: monthRange.from, to: monthRange.to },
    { skip: meetingsSource !== 'owner' }
  )
  const adminUpcomingQuery = useGetMeetingsQuery(
    { limit: 20, status: 'Scheduled', from: upcomingFrom },
    { skip: meetingsSource !== 'admin' }
  )
  const ownerUpcomingQuery = useGetOwnerMeetingsQuery(
    { limit: 20, upcomingOnly: true },
    { skip: meetingsSource !== 'owner' }
  )
  const crmQuery = useGetCrmScheduleCalendarQuery(
    { from: monthRange.from || upcomingFrom, to: monthRange.to || upcomingFrom },
    { skip: !isCrmZoho || !monthRange.from || !monthRange.to }
  )

  const entries: CalendarEntry[] = useMemo(() => {
    if (isCrmZoho) return (crmQuery.data?.items ?? []).map(crmItemToEntry)
    const meetings = (meetingsSource === 'owner' ? ownerQuery.data?.items : adminQuery.data?.items) ?? []
    return meetings.map(meetingToEntry)
  }, [isCrmZoho, crmQuery.data?.items, meetingsSource, ownerQuery.data?.items, adminQuery.data?.items])

  const isLoading = isCrmZoho
    ? crmQuery.isLoading
    : meetingsSource === 'owner'
      ? ownerQuery.isLoading
      : adminQuery.isLoading
  const isError = isCrmZoho ? crmQuery.isError : meetingsSource === 'owner' ? ownerQuery.isError : adminQuery.isError

  const upcomingEntries = useMemo(() => {
    if (isCrmZoho) {
      return [...entries]
        .filter((e) => {
          const day = meetingDayKey(e)
          if (!day || day < upcomingFrom) return false
          if (e.kind === 'work_note') return e.status !== 'complete'
          return e.status === 'Scheduled'
        })
        .sort((a, b) => String(a.startsAt || a.date).localeCompare(String(b.startsAt || b.date)))
        .slice(0, 20)
    }
    const rows = (meetingsSource === 'owner' ? ownerUpcomingQuery.data?.items : adminUpcomingQuery.data?.items) ?? []
    return rows
      .filter((m) => m.status === 'Scheduled')
      .map(meetingToEntry)
      .sort((a, b) => String(a.startsAt || a.date).localeCompare(String(b.startsAt || b.date)))
  }, [isCrmZoho, entries, upcomingFrom, meetingsSource, ownerUpcomingQuery.data?.items, adminUpcomingQuery.data?.items])

  const [createMeeting, { isLoading: isCreating }] = useCreateMeetingMutation()
  const [updateMeeting] = useUpdateMeetingMutation()
  const [deleteMeeting] = useDeleteMeetingMutation()
  const [updateCrmEvent] = useUpdateCrmEventMutation()
  const [deleteCrmEvent] = useDeleteCrmEventMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [bookDate, setBookDate] = useState(todayIsoDate())
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return entries
    return entries.filter(
      (m) =>
        m.host.toLowerCase().includes(q) ||
        String(m.type).toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q) ||
        (m.notes || '').toLowerCase().includes(q) ||
        meetingDayKey(m).includes(q) ||
        m.kind.includes(q)
    )
  }, [entries, searchQuery])

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>()
    for (const meeting of filteredEntries) {
      const key = meetingDayKey(meeting)
      if (!key) continue
      const list = map.get(key) || []
      list.push(meeting)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => String(a.time).localeCompare(String(b.time)))
    }
    return map
  }, [filteredEntries])

  const monthCells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth])
  const todayKey = todayIsoDate()
  const selectedMeetings = selectedDay ? meetingsByDay.get(selectedDay) || [] : []

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const handleDayClick = (cell: CalendarCell) => {
    setSelectedDay(cell.key)
  }

  const openBookModal = (date: string) => {
    setBookDate(date)
    setIsAddOpen(true)
  }

  const handleUpdateStatus = async (entry: CalendarEntry, nextStatus: MeetingStatus | CrmEventStatus) => {
    try {
      if (entry.kind === 'event') {
        await updateCrmEvent({ id: entry.id, body: { status: nextStatus as CrmEventStatus } }).unwrap()
      } else {
        await updateMeeting({ id: entry.id, body: { status: nextStatus as MeetingStatus } }).unwrap()
      }
      if (nextStatus === 'Cancelled' || nextStatus === 'Completed') setSelectedDay(null)
    } catch {
      /* toast handled upstream if wired */
    }
  }

  const handleDeleteMeeting = (meeting: CalendarEntry) => {
    const isEvent = meeting.kind === 'event'
    setConfirmState({
      open: true,
      title: isEvent ? 'Delete this event?' : 'Delete this session?',
      description: `Remove ${meeting.type} with ${meeting.host} on ${meeting.date}. This cannot be undone.`,
      onConfirm: () => {
        void (async () => {
          try {
            if (isEvent) {
              await deleteCrmEvent(meeting.id).unwrap()
            } else {
              await deleteMeeting(meeting.id).unwrap()
            }
            setSelectedDay((day) => {
              if (!day) return null
              const remaining = (meetingsByDay.get(day) || []).filter(
                (m) => !(m.id === meeting.id && m.kind === meeting.kind)
              )
              return remaining.length ? day : null
            })
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const handleBookMeeting = async (payload: ScheduleMeetingSubmitPayload) => {
    const created = await submitScheduleMeeting(createMeeting, payload)

    setSelectedDay(payload.date)
    const [y, m] = payload.date.split('-').map(Number)
    if (y && m) {
      setViewYear(y)
      setViewMonth(m - 1)
    }

    return created
  }

  const monthMeetingCount = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    return filteredEntries.filter((m) => meetingDayKey(m).startsWith(prefix)).length
  }, [filteredEntries, viewYear, viewMonth])

  const renderMeetingActions = (mtg: CalendarEntry) => {
    if (!canManageMeetings || !mtg.canManageMeeting) return null
    if (mtg.kind !== 'meeting' && mtg.kind !== 'event') return null
    return (
      <div className="flex gap-2">
        {mtg.status === 'Scheduled' && (
          <>
            <button
              type="button"
              onClick={() => void handleUpdateStatus(mtg, 'Completed')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-[10px] font-bold tracking-wide text-white uppercase transition hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
            </button>
            <button
              type="button"
              onClick={() => void handleUpdateStatus(mtg, 'Cancelled')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              title={mtg.kind === 'event' ? 'Cancel Event' : 'Cancel Meeting'}
            >
              <XCircle className="h-4 w-4" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => handleDeleteMeeting(mtg)}
          className="rounded-xl border border-rose-200/80 bg-rose-50 px-3 py-2.5 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10"
          title="Delete Record"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'animate-in fade-in relative mx-auto max-w-7xl space-y-6 duration-500',
        compact ? 'p-0' : 'p-5 sm:p-8 lg:p-10'
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.12),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.03),transparent)] dark:bg-[radial-gradient(ellipse_at_top,rgba(45,212,191,0.08),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]"
      />

      <header className="flex flex-col gap-5 border-b border-slate-200/70 pb-6 md:flex-row md:items-end md:justify-between dark:border-white/10">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-teal-700 uppercase dark:text-teal-300">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 font-(family-name:--font-geist-sans,ui-sans-serif) text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => openBookModal(selectedDay || todayIsoDate())}
          className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-slate-950 px-5 py-3.5 text-xs font-semibold tracking-wide text-white uppercase transition hover:bg-slate-800 active:scale-[0.98] md:self-auto dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
        >
          <Plus className="h-4 w-4" /> Book discussion
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur dark:border-white/10 dark:bg-[#0d121c]/90">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isCrmZoho
                ? 'Filter by host, type, note, or date…'
                : meetingsSource === 'owner'
                  ? 'Filter by type, notes, or date…'
                  : 'Filter by owner, type, notes, or date…'
            }
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none dark:text-white"
          />
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-xs font-semibold text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#0d121c]/90 dark:text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-sm bg-teal-500" />
          {monthMeetingCount} this month
          <span className="text-slate-300 dark:text-white/20">·</span>
          {filteredEntries.length} total
        </div>
      </div>

      {meetingsSource === 'admin' ? <OneOnOneRequestsPanel /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-[linear-gradient(135deg,rgba(13,148,136,0.08),transparent_42%),linear-gradient(180deg,#f8fafc,#ffffff)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-white/5 dark:bg-[linear-gradient(135deg,rgba(45,212,191,0.08),transparent_45%),linear-gradient(180deg,#0f1622,#0b1018)]">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                {monthTitle(viewYear, viewMonth)}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                {isCrmZoho
                  ? 'Loaded from your database. New bookings still sync to Zoho.'
                  : 'Each pin shows the time and host. Click an empty day to book.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-start rounded-2xl border border-slate-200/80 bg-white/80 p-1 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date()
                  setViewYear(d.getFullYear())
                  setViewMonth(d.getMonth())
                  setSelectedDay(todayKey)
                }}
                className="rounded-xl px-3.5 py-2 text-[11px] font-semibold tracking-wide text-slate-700 uppercase transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            {isLoading ? (
              <AdminScheduleCalendarSkeleton />
            ) : isError ? (
              <div className="py-20 text-center text-sm font-semibold text-rose-500">Failed to load schedules.</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/80 dark:border-white/10 dark:bg-white/10">
                  {WEEKDAYS.map((label) => (
                    <div
                      key={label}
                      className="bg-slate-50 px-1 py-2.5 text-center text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:bg-[#101826] dark:text-slate-400"
                    >
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label.slice(0, 1)}</span>
                    </div>
                  ))}
                  {monthCells.map((cell) => {
                    const items = meetingsByDay.get(cell.key) || []
                    const extra = Math.max(0, items.length - 2)
                    const isToday = cell.key === todayKey
                    const isSelected = cell.key === selectedDay
                    const hasItems = items.length > 0
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => handleDayClick(cell)}
                        className={cn(
                          'group relative flex min-h-22 flex-col gap-1 bg-white p-1.5 text-left transition sm:min-h-28 sm:p-2 dark:bg-[#0d121c]',
                          !cell.inMonth && 'bg-slate-50/90 text-slate-400 dark:bg-[#0a0e16] dark:text-slate-600',
                          cell.inMonth && 'hover:bg-teal-50/50 dark:hover:bg-teal-500/5',
                          isSelected && 'bg-teal-50 ring-2 ring-teal-500/50 ring-inset dark:bg-teal-500/10',
                          isToday && !isSelected && 'bg-[linear-gradient(180deg,rgba(13,148,136,0.08),transparent_40%)]'
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[12px] font-semibold tabular-nums',
                              isToday
                                ? 'bg-slate-950 text-white dark:bg-teal-400 dark:text-slate-950'
                                : cell.inMonth
                                  ? 'text-slate-700 dark:text-slate-200'
                                  : 'text-slate-400 dark:text-slate-600'
                            )}
                          >
                            {cell.day}
                          </span>
                          {hasItems ? (
                            <span className="hidden h-1.5 w-1.5 rounded-sm bg-teal-500 sm:inline-block" aria-hidden />
                          ) : null}
                        </div>
                        <div className="mt-auto space-y-1">
                          {items.slice(0, 2).map((meeting) => (
                            <span
                              key={`${meeting.kind}-${meeting.id}`}
                              className={cn(
                                'flex items-center gap-1 truncate rounded-lg border px-1.5 py-1 text-[9px] leading-tight font-semibold',
                                pinTone(meeting)
                              )}
                              title={`${meeting.time} · ${
                                meeting.kind === 'work_note'
                                  ? meeting.title || meeting.host
                                  : meeting.kind === 'event'
                                    ? meeting.type
                                    : meeting.host
                              } · ${meeting.type}`}
                            >
                              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-sm', statusDot(meeting))} />
                              <span className="truncate">
                                <span className="tabular-nums">{meeting.time}</span>
                                <span className="opacity-70"> · </span>
                                {meeting.kind === 'work_note'
                                  ? meeting.title || meeting.host
                                  : meeting.kind === 'event'
                                    ? meeting.type
                                    : meeting.host}
                              </span>
                            </span>
                          ))}
                          {extra > 0 ? (
                            <span className="block px-1 text-[9px] font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300">
                              +{extra} more
                            </span>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-sky-500" /> Scheduled
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Completed
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-slate-400" /> Cancelled
                  </span>
                  {isCrmZoho ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-amber-500" /> Note
                    </span>
                  ) : null}
                  {isCrmZoho ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-rose-500" /> Event
                    </span>
                  ) : null}
                </div>

                {filteredEntries.length === 0 ? (
                  <p className="mt-8 pb-4 text-center text-sm font-medium text-slate-400">
                    {isCrmZoho
                      ? 'No meetings, events, or timed notes in this range. Book a session or create an event to add one.'
                      : 'No discussions match this filter. Book a session to pin it on the calendar.'}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </section>

        <UpcomingSchedulesPanel
          meetings={upcomingEntries}
          isLoading={isLoading}
          title="Next up"
          subtitle={upcomingSubtitle}
          compact
        />
      </div>

      {selectedDay && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
              onClick={() => setSelectedDay(null)}
            />
            <div className="animate-in slide-in-from-bottom-4 sm:zoom-in-95 relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white shadow-2xl duration-200 sm:rounded-[28px] dark:border-white/10 dark:bg-[#0b1018]">
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur dark:border-white/5 dark:bg-[#0b1018]/95">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
                      Day agenda
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {formatDayHeading(selectedDay)}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {selectedMeetings.length} item{selectedMeetings.length === 1 ? '' : 's'}
                    </p>
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
                {selectedMeetings.length === 0 ? (
                  <p className="py-8 text-center text-sm font-medium text-slate-400">Nothing scheduled on this date.</p>
                ) : (
                  selectedMeetings.map((mtg) => (
                    <article
                      key={`${mtg.kind}-${mtg.id}`}
                      className="space-y-3 rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc,#ffffff)] p-4 dark:border-white/10 dark:bg-white/3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold tracking-[0.14em] text-teal-700 uppercase dark:text-teal-300">
                            {mtg.type}
                          </p>
                          <h4 className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                            {mtg.kind === 'work_note'
                              ? mtg.title || mtg.host
                              : mtg.kind === 'event'
                                ? mtg.type
                                : `Discussion with ${mtg.host}`}
                          </h4>
                        </div>
                        <span
                          className={cn(
                            'rounded-lg border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase',
                            pinTone(mtg)
                          )}
                        >
                          {mtg.kind === 'work_note' ? workNoteStatusLabel(mtg.status) : mtg.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" /> {mtg.time}
                        </span>
                        {mtg.kind === 'event' ? (
                          <span className="text-[10px] font-semibold tracking-wide text-rose-600 uppercase dark:text-rose-300">
                            Event · {mtg.host}
                          </span>
                        ) : null}
                        {mtg.meetLink && mtg.kind === 'meeting' ? (
                          <a
                            href={mtg.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline dark:text-teal-300"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> {meetLinkLabel(mtg.meetLink) || 'Join meeting'}
                          </a>
                        ) : null}
                      </div>
                      {mtg.kind === 'event' && mtg.attachments?.length ? (
                        <ul className="space-y-1 text-xs text-slate-500">
                          {mtg.attachments.map((file, index) => (
                            <li key={`${file.url}-${index}`}>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-rose-700 hover:underline dark:text-rose-300"
                              >
                                {file.fileName}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : mtg.notes ? (
                        <p className="text-xs leading-relaxed text-slate-500">{mtg.notes}</p>
                      ) : null}
                      {renderMeetingActions(mtg)}
                    </article>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-4 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null)
                    openBookModal(selectedDay)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-[11px] font-semibold tracking-wide text-white uppercase transition hover:bg-slate-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
                >
                  <Plus className="h-4 w-4" /> Book on this date
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <ScheduleMeetingModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        isSubmitting={isCreating}
        initialDate={bookDate}
        allowedScopes={allowedScopes}
        defaultScope={defaultScope}
        cardPicker={cardPicker ?? (meetingsSource === 'owner' ? 'own' : 'admin')}
        personSearch={personSearch}
        title="Book a time"
        subtitle={
          personSearch
            ? 'Search cards or saved guests. If they aren’t listed, add a CRM lead — that sheet opens on top and then fills this booking.'
            : meetingsSource === 'owner'
              ? 'Choose one of your cards, then pick a date and time. We’ll include a meeting link.'
              : 'Find an owner by name, email, designation, profession, company, or card slug.'
        }
        onSubmit={async (payload) => {
          try {
            return await handleBookMeeting(payload)
          } catch {
            return undefined
          }
        }}
      />

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
