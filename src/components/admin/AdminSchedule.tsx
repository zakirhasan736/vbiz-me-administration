'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import { AdminScheduleCalendarSkeleton } from '@/components/admin/AdminScheduleSkeleton'
import ProfileOwnerPicker, { type ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { notifyOwners } from '@/lib/notifications'
import {
  useCreateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingsQuery,
  useUpdateMeetingMutation,
} from '@/redux/features/meetings/meetings.api'
import { MEETING_TYPES, type Meeting, type MeetingStatus, type MeetingType } from '@/types/meeting'
import { cn } from '@/utils/cn'
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayIsoDate(): string {
  return toIsoDate(new Date())
}

function meetingDayKey(meeting: Meeting): string {
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

function pinTone(status: MeetingStatus) {
  if (status === 'Completed') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  if (status === 'Cancelled') return 'bg-slate-200/80 text-slate-500 dark:bg-white/10 dark:text-slate-400'
  return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
}

export default function AdminSchedule() {
  const now = new Date()
  const { data, isLoading, isError } = useGetMeetingsQuery({ limit: 100 })
  const [createMeeting, { isLoading: isCreating }] = useCreateMeetingMutation()
  const [updateMeeting] = useUpdateMeetingMutation()
  const [deleteMeeting] = useDeleteMeetingMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [owner, setOwner] = useState<ProfileOwnerSelection | null>(null)
  const [meetType, setMeetType] = useState<MeetingType>('Growth Meeting')
  const [meetDate, setMeetDate] = useState(todayIsoDate())
  const [meetTime, setMeetTime] = useState('10:00 AM')
  const [meetNotes, setMeetNotes] = useState('')
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const filteredMeetings = useMemo(() => {
    const meetings = data?.items ?? []
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
  }, [data?.items, searchQuery])

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>()
    for (const meeting of filteredMeetings) {
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
  }, [filteredMeetings])

  const monthCells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth])
  const todayKey = todayIsoDate()
  const selectedMeetings = selectedDay ? meetingsByDay.get(selectedDay) || [] : []

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const openBookModal = (isoDate?: string) => {
    setMeetDate(isoDate || todayIsoDate())
    setIsAddOpen(true)
  }

  const handleDayClick = (cell: CalendarCell) => {
    const items = meetingsByDay.get(cell.key) || []
    if (items.length) {
      setSelectedDay(cell.key)
      return
    }
    if (cell.inMonth) openBookModal(cell.key)
  }

  const handleUpdateStatus = async (id: string, nextStatus: MeetingStatus) => {
    try {
      await updateMeeting({ id, body: { status: nextStatus } }).unwrap()
    } catch {
      /* RTK surfaces error via cache */
    }
  }

  const handleDeleteMeeting = (meeting: Meeting) => {
    setConfirmState({
      open: true,
      title: 'Cancel scheduled discussion?',
      description: `Cancel and remove scheduled discussion with ${meeting.host}?`,
      onConfirm: () => {
        void (async () => {
          try {
            await deleteMeeting(meeting.id).unwrap()
            setSelectedDay((day) => {
              if (!day) return day
              const remaining = (meetingsByDay.get(day) || []).filter((row) => row.id !== meeting.id)
              return remaining.length ? day : null
            })
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!owner || isCreating) return

    try {
      const created = await createMeeting({
        host: owner.hostName,
        type: meetType,
        date: meetDate,
        time: meetTime,
        notes: meetNotes.trim() || 'Advisory consultation session.',
        status: 'Scheduled',
        profileId: owner.profileId,
      }).unwrap()

      setIsAddOpen(false)
      setOwner(null)
      setMeetNotes('')
      setSelectedDay(meetDate)
      const [y, m] = meetDate.split('-').map(Number)
      if (y && m) {
        setViewYear(y)
        setViewMonth(m - 1)
      }

      const meetSuffix = created.meetLink ? ` · Meet: ${created.meetLink}` : ''
      notifyOwners({
        category: 'event',
        title: 'New admin event scheduled',
        body: `${meetType} with ${owner.hostName} on ${meetDate} at ${meetTime}${meetSuffix}`,
        forceBrowser: true,
      })
    } catch {
      /* keep modal open on failure */
    }
  }

  const renderMeetingActions = (mtg: Meeting) => (
    <div className="flex gap-2">
      {mtg.status === 'Scheduled' && (
        <>
          <button
            type="button"
            onClick={() => void handleUpdateStatus(mtg.id, 'Completed')}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-[10px] font-black tracking-wider text-white uppercase hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
          </button>
          <button
            type="button"
            onClick={() => void handleUpdateStatus(mtg.id, 'Cancelled')}
            className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            title="Cancel Meeting"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => handleDeleteMeeting(mtg)}
        className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-100"
        title="Delete Record"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-6 duration-500 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <Calendar className="h-7 w-7 text-indigo-600 dark:text-indigo-400" /> Schedules & Meetings Manager
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Pin discussions on the calendar by date and time. Click a day to view details or book another session.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openBookModal(selectedDay || todayIsoDate())}
          className="flex items-center gap-2 self-start rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-[0.98] md:self-auto"
        >
          <Plus className="h-4 w-4" /> Book New Discussion
        </button>
      </div>

      <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-slate-800/50">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by card owner, meeting type, notes, or date..."
          className="w-full bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none dark:text-white"
        />
      </div>

      <div className="rounded-4xl border border-slate-200/80 bg-white p-4 shadow-sm md:p-8 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-indigo-500" /> Schedule calendar
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Pins show time and owner. Click a pin or date to open details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="min-w-36 text-center text-sm font-black text-slate-900 dark:text-white">
              {monthTitle(viewYear, viewMonth)}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date()
                setViewYear(d.getFullYear())
                setViewMonth(d.getMonth())
                setSelectedDay(todayKey)
              }}
              className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black tracking-wider text-slate-700 uppercase dark:bg-white/10 dark:text-slate-200"
            >
              Today
            </button>
          </div>
        </div>

        {isLoading ? (
          <AdminScheduleCalendarSkeleton />
        ) : isError ? (
          <div className="py-16 text-center text-sm font-semibold text-rose-500">Failed to load schedules.</div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((label) => (
                <div
                  key={label}
                  className="pb-2 text-center text-[10px] font-black tracking-wider text-slate-400 uppercase"
                >
                  {label}
                </div>
              ))}
              {monthCells.map((cell) => {
                const items = meetingsByDay.get(cell.key) || []
                const extra = Math.max(0, items.length - 3)
                const isToday = cell.key === todayKey
                const isSelected = cell.key === selectedDay
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => handleDayClick(cell)}
                    className={cn(
                      'min-h-24 rounded-xl border p-1.5 text-left transition-colors sm:min-h-28',
                      cell.inMonth
                        ? 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-white/10 dark:bg-[#0e1424] dark:hover:border-indigo-500/30'
                        : 'border-transparent bg-slate-50/70 text-slate-400 dark:bg-white/2',
                      isToday && 'ring-2 ring-indigo-500/40',
                      isSelected && 'border-indigo-400 bg-indigo-50/70 dark:border-indigo-400/50 dark:bg-indigo-500/10'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black',
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {cell.day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {items.slice(0, 3).map((meeting) => (
                        <span
                          key={meeting.id}
                          className={cn(
                            'block truncate rounded-md px-1 py-0.5 text-[9px] font-bold',
                            pinTone(meeting.status)
                          )}
                          title={`${meeting.time} · ${meeting.host}`}
                        >
                          {meeting.time} {meeting.host}
                        </span>
                      ))}
                      {extra > 0 ? (
                        <span className="block px-1 text-[9px] font-black tracking-wider text-indigo-500 uppercase">
                          +{extra} more
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
            {filteredMeetings.length === 0 ? (
              <p className="mt-6 text-center text-sm font-semibold text-slate-400">
                No scheduled discussions match the filters. Book a new discussion to pin it on the calendar.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {selectedDay && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
            <div className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">{formatDayHeading(selectedDay)}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {selectedMeetings.length} scheduled discussion{selectedMeetings.length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {selectedMeetings.length === 0 ? (
                  <p className="py-6 text-center text-sm font-semibold text-slate-400">No discussions on this date.</p>
                ) : (
                  selectedMeetings.map((mtg) => (
                    <div
                      key={mtg.id}
                      className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                            {mtg.type}
                          </p>
                          <h4 className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">
                            Discussion with {mtg.host}
                          </h4>
                        </div>
                        <span
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                            pinTone(mtg.status)
                          )}
                        >
                          {mtg.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {mtg.time}
                        </span>
                        {mtg.meetLink ? (
                          <a
                            href={mtg.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Google Meet
                          </a>
                        ) : null}
                      </div>
                      {mtg.notes ? (
                        <p className="text-xs leading-relaxed font-semibold text-slate-500">{mtg.notes}</p>
                      ) : null}
                      {renderMeetingActions(mtg)}
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null)
                  openBookModal(selectedDay)
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-[11px] font-black tracking-wider text-white uppercase hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Book on this date
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {isAddOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />

            <div className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <Calendar className="h-5 w-5 shrink-0 text-indigo-600" /> Book Growth Discussion
                  </h2>
                  <p className="mt-1 font-sans text-xs font-semibold text-slate-400">
                    Search card owners by name, email, designation, profession, company, or card slug, then pick date
                    and time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={(e) => void handleAddSubmit(e)} className="mt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Discussion Medium
                  </label>
                  <select
                    value={meetType}
                    onChange={(e) => setMeetType(e.target.value as MeetingType)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  >
                    {MEETING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <ProfileOwnerPicker
                  value={owner}
                  onChange={setOwner}
                  label="Card owner"
                  listClassName="max-h-56"
                  includeDrafts
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Date</label>
                    <input
                      type="date"
                      value={meetDate}
                      onChange={(e) => setMeetDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      required
                      value={meetTime}
                      onChange={(e) => setMeetTime(e.target.value)}
                      placeholder="e.g. 10:30 AM"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Discussion Notes / Targets
                  </label>
                  <textarea
                    value={meetNotes}
                    onChange={(e) => setMeetNotes(e.target.value)}
                    placeholder="e.g. Reviewing custom QR display dimensions..."
                    className="min-h-22.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !owner}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isCreating ? 'Saving…' : 'Save Schedule Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

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
