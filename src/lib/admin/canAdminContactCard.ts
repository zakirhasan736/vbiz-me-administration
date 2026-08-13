import { isAdminPortfolioCard, normalizeRole } from '@/lib/admin/adminCardBadge'
import type { AdminCard } from '@/lib/admin/adminCardShape'

/** Admin outreach (email/call/schedule) — single/corporate owners only, not portfolio cards. */
export function canAdminContactCard(card: AdminCard, currentUserId?: string | null): boolean {
  if (isAdminPortfolioCard(card)) return false
  if (currentUserId && card.ownerId && String(card.ownerId) === String(currentUserId)) return false
  const role = normalizeRole(card.ownerRole)
  if (role && role !== 'vcard-owner' && role !== 'corporate-owner') return false
  return true
}
