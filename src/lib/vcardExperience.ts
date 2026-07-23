import type { VCardExperienceEntry } from '@/types/vcard'

export function createDefaultExperienceEntry(): VCardExperienceEntry {
  return {
    id: `exp_${Date.now()}`,
    company: '',
    jobTitle: '',
    description: '',
    fromDate: '',
    toDate: '',
    tillNow: false,
  }
}

export function normalizeExperienceList(raw?: VCardExperienceEntry[] | null): VCardExperienceEntry[] {
  if (!raw?.length) return [createDefaultExperienceEntry()]
  return raw.map((entry) => ({
    id: entry.id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    company: entry.company ?? '',
    jobTitle: entry.jobTitle ?? '',
    description: entry.description ?? '',
    fromDate: entry.fromDate ?? '',
    toDate: entry.toDate ?? '',
    tillNow: Boolean(entry.tillNow),
  }))
}

/** Entries with at least company or job title — used on the public profile. */
export function getPublishedExperienceEntries(entries: VCardExperienceEntry[]): VCardExperienceEntry[] {
  return entries.filter((e) => e.company.trim() || e.jobTitle.trim())
}

export function formatExperienceDate(date: string): string {
  if (!date.trim()) return ''
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatExperienceDateRange(entry: VCardExperienceEntry): string {
  const from = formatExperienceDate(entry.fromDate)
  const to = entry.tillNow ? 'Present' : formatExperienceDate(entry.toDate)
  if (!from && !to) return ''
  if (!from) return to
  if (!to) return from
  return `${from} – ${to}`
}
