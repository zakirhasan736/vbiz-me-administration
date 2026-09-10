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

export function normalizeRole(role: unknown): string {
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

export function isAdminPortfolioCard(card: AdminCard): boolean {
  return isStaffRole(portfolioParentRole(card))
}

/**
 * True when the card sits under a corporate owner portfolio (main or member).
 * Corporate signals win over createdBy staff (admins often create corporate cards).
 */
export function isCorporatePortfolioCard(card: AdminCard): boolean {
  // Explicit corporate company parent
  if (isCorporateRole(card.companyUserRole)) return true

  // Corporate owner's own main card (no company parent, or self-parent)
  if (isCorporateRole(card.ownerRole) && !isStaffRole(card.companyUserRole)) {
    if (!card.companyUserId || card.companyUserId === card.ownerId) return true
    // Owned by corporate user but parked under a staff company → admin portfolio, not corporate team
    if (isStaffRole(card.companyUserRole)) return false
    return true
  }

  // Member card linked to a company account: owner is single (vcard-owner), company is not staff
  if (
    card.companyUserId &&
    card.companyUserId !== card.ownerId &&
    !isStaffRole(card.ownerRole) &&
    !isStaffRole(card.companyUserRole)
  ) {
    // Prefer known corporate company role; if role missing, still treat linked non-staff company as corporate team
    if (!card.companyUserRole || isCorporateRole(card.companyUserRole)) return true
    if (normalizeRole(card.ownerRole) === 'vcard-owner') return true
  }

  return false
}

function isCorporateCard(card: AdminCard): boolean {
  return isCorporatePortfolioCard(card)
}

/** Badge for Admin → My Cards portfolio. */
export function resolveMyCardsBadge(card: AdminCard): AdminCardBadge | null {
  if (isAdminNamedCard(card)) {
    return { label: 'Admin', tone: 'indigo' }
  }
  if (isCorporateCard(card)) {
    return { label: 'Corporate', tone: 'neutral' }
  }
  return null
}

/** Badge for Admin → vCards directory. */
export function resolveDirectoryBadge(card: AdminCard): AdminCardBadge | null {
  if (isAdminNamedCard(card)) {
    return { label: 'Admin', tone: 'indigo' }
  }
  // Corporate team cards first — createdBy is often staff when admin provisioned the account
  if (isCorporateCard(card)) {
    return { label: 'Corporate member', tone: 'neutral' }
  }
  if (isAdminPortfolioCard(card)) {
    return null
  }
  return { label: 'Single', tone: 'violet' }
}
