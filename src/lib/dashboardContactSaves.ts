import type { DashboardStats } from '@/redux/features/profiles/profiles.api'

/**
 * Guest contact saves for the selected dashboard period (GuestUserData form rows).
 * Prefer `contactSaves` (aligned with list APIs); fall back to `guestsLast30Days`.
 */
export function resolveDashboardContactSaves(stats?: DashboardStats | null): number {
  if (!stats) return 0
  if (typeof stats.contactSaves === 'number') return stats.contactSaves
  return stats.guestsLast30Days ?? 0
}
