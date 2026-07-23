import type { VCardEducationEntry } from '@/types/vcard'

export function createDefaultEducationEntry(): VCardEducationEntry {
  return {
    id: `edu_${Date.now()}`,
    institute: '',
    degree: '',
    fromDate: '',
    toDate: '',
    tillNow: false,
  }
}

export function normalizeEducationList(raw?: VCardEducationEntry[] | null): VCardEducationEntry[] {
  if (!raw?.length) return [createDefaultEducationEntry()]
  return raw.map((entry) => ({
    id: entry.id || `edu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    institute: entry.institute ?? '',
    degree: entry.degree ?? '',
    fromDate: entry.fromDate ?? '',
    toDate: entry.toDate ?? '',
    tillNow: Boolean(entry.tillNow),
  }))
}

/** Entries with at least institute or degree — used on the public profile. */
export function getPublishedEducationEntries(entries: VCardEducationEntry[]): VCardEducationEntry[] {
  return entries.filter((e) => e.institute.trim() || e.degree.trim())
}

export function formatEducationDate(date: string): string {
  if (!date.trim()) return ''
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatEducationDateRange(entry: VCardEducationEntry): string {
  const from = formatEducationDate(entry.fromDate)
  const to = entry.tillNow ? 'Present' : formatEducationDate(entry.toDate)
  if (!from && !to) return ''
  if (!from) return to
  if (!to) return from
  return `${from} – ${to}`
}
