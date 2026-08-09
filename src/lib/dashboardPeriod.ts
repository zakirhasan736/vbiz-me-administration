import type { DashboardPeriod } from '@/redux/features/profiles/profiles.api'

/** Cutoff date for a period window; `null` means All (no cutoff). */
export function periodCutoff(period: DashboardPeriod, now = new Date()): Date | null {
  if (period === 'all') return null
  const days = Number(period)
  if (!Number.isFinite(days) || days <= 0) return null
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

/** Scale factor for cumulative metrics that lack per-event timestamps. */
export function periodScale(period: DashboardPeriod): number {
  if (period === 'all') return 1
  const days = Number(period)
  if (!Number.isFinite(days) || days <= 0) return 1
  return Math.min(1, days / 90)
}

export function isWithinPeriod(isoOrDate: string | Date | null | undefined, cutoff: Date | null): boolean {
  if (!cutoff) return true
  if (!isoOrDate) return false
  const t = isoOrDate instanceof Date ? isoOrDate.getTime() : new Date(isoOrDate).getTime()
  if (Number.isNaN(t)) return false
  return t >= cutoff.getTime()
}
