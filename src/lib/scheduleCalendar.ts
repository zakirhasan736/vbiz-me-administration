import type { Meeting, MeetingStatus } from '@/types/meeting'

export const SCHEDULE_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayIsoDate(): string {
  return toIsoDate(new Date())
}

export function meetingDayKey(meeting: Meeting): string {
  const raw = (meeting.date || meeting.startsAt || '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return toIsoDate(parsed)
}

export function formatDayHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export type CalendarCell = { key: string; day: number; inMonth: boolean }

export function buildMonthCells(year: number, month: number): CalendarCell[] {
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

export function pinTone(status: MeetingStatus) {
  if (status === 'Completed') {
    return 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
  }
  if (status === 'Cancelled') {
    return 'border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
  }
  return 'border-teal-200/80 bg-teal-50 text-teal-900 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-200'
}

export function meetingsByDayMap(meetings: Meeting[]): Map<string, Meeting[]> {
  const map = new Map<string, Meeting[]>()
  for (const meeting of meetings) {
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
}

export function monthRangeIso(year: number, month: number) {
  const from = toIsoDate(new Date(year, month, 1))
  const to = toIsoDate(new Date(year, month + 1, 0))
  return { from, to }
}
