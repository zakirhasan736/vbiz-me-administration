import type { DashboardStats } from '@/redux/features/profiles/profiles.api'

/** Guest contact saves for the selected dashboard period (GuestUserData rows). */
export function resolveDashboardContactSaves(stats?: DashboardStats | null): number {
  if (!stats) return 0
  return stats.contactSaves ?? stats.guestsLast30Days ?? 0
}
