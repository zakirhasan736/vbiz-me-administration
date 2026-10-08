/** Shown on a corporate member card. The corporate owner card in the same group stays duplicable. */
export const CORPORATE_MEMBER_DUPLICATE_REASON =
  'Only the corporate owner card can be duplicated. Team member cards stay as they are.'

/**
 * True for a card inside a corporate group that is not the corporate owner's own card.
 * The API flag decides when present, so single cards are never treated as members.
 */
export function isCorporateGroupMemberCard(card: {
  corporateMemberCard?: boolean | null
  duplicatedFrom?: string | null
  profileUserId?: string | null
  companyUserId?: string | null
}): boolean {
  if (typeof card.corporateMemberCard === 'boolean') return card.corporateMemberCard
  const duplicatedFrom = String(card.duplicatedFrom || '').trim()
  if (duplicatedFrom) return true
  const userId = String(card.profileUserId || '').trim()
  const companyUserId = String(card.companyUserId || '').trim()
  return Boolean(companyUserId && userId && companyUserId !== userId)
}
