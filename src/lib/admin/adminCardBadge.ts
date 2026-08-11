import type { AdminCard } from '@/lib/admin/adminCardShape'

export type AdminCardBadgeTone = 'neutral' | 'violet' | 'indigo'

export type AdminCardBadge = {
  label: string
  tone: AdminCardBadgeTone
}

function personalName(card: AdminCard): string {
  const value = card.personal?.fullName
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeRole(role: unknown): string {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
}

function isStaffRole(role: unknown): boolean {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'super-admin'
}

function isCorporateRole(role: unknown): boolean {
  const r = normalizeRole(role)
  return r === 'corporate-owner' || r.includes('corporate')
}

/** Card named/slugged "Admin" — not every card owned by an admin user. */
function isAdminNamedCard(card: AdminCard): boolean {
  const name = personalName(card)
  const slug = String(card.slug || '')
    .trim()
    .toLowerCase()
  return name === 'admin' || slug === 'admin'
}

/**
 * Portfolio parent for badges:
 * - companyUserRole / createdByRole from API (preferred)
 * - falls back to ownerRole only when companyUserId === ownerId
 *
 * Corporate member = parent account is a corporate-owner.
 * Admin portfolio (Team member) = parent is admin/super-admin.
 * Do NOT use profile ownerRole alone — MC is CORPORATE_OWNER personally but his
 * vBiz Me CEO card sits under SUPER_ADMIN companyUser.
 */
function portfolioParentRole(card: AdminCard): string {
  const companyRole = normalizeRole(card.companyUserRole)
  if (companyRole) return companyRole
  const createdRole = normalizeRole(card.createdByRole)
  if (createdRole) return createdRole
  if (card.companyUserId && card.companyUserId === card.ownerId) {
    return normalizeRole(card.ownerRole)
  }
  return ''
}

function isAdminPortfolioCard(card: AdminCard): boolean {
  return isStaffRole(portfolioParentRole(card))
}

function isCorporateCard(card: AdminCard): boolean {
  if (isAdminPortfolioCard(card)) return false
  const parent = portfolioParentRole(card)
  if (isCorporateRole(parent)) return true
  // Corporate owner's own card with companyUser pointing at themselves / corp account
  if (card.companyUserId && isCorporateRole(card.ownerRole) && !isStaffRole(card.ownerRole)) {
    return true
  }
  return false
}

/** Badge for Admin → My Cards portfolio. */
export function resolveMyCardsBadge(card: AdminCard): AdminCardBadge {
  if (isAdminNamedCard(card)) {
    return { label: 'Admin', tone: 'indigo' }
  }
  if (isCorporateCard(card)) {
    return { label: 'Corporate', tone: 'neutral' }
  }
  return { label: 'Team member', tone: 'violet' }
}

/** Badge for Admin → vCards directory. */
export function resolveDirectoryBadge(card: AdminCard): AdminCardBadge {
  if (isAdminNamedCard(card)) {
    return { label: 'Admin', tone: 'indigo' }
  }
  if (isAdminPortfolioCard(card)) {
    return { label: 'Team member', tone: 'violet' }
  }
  if (isCorporateCard(card)) {
    return { label: 'Corporate member', tone: 'neutral' }
  }
  return { label: 'Single', tone: 'violet' }
}
