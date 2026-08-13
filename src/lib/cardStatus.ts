export type CardLifecycleStatus = 'draft' | 'active' | 'inactive' | 'paused' | 'suspended'

export function normalizeCardStatus(name?: string | null): string {
  return String(name || '')
    .trim()
    .toLowerCase()
}

export function resolveCardStatus(input: {
  status?: string | null
  isDraft?: boolean
  isPublic?: boolean
  isActive?: boolean
}): CardLifecycleStatus {
  const raw = normalizeCardStatus(input.status)
  if (raw === 'suspended') return 'suspended'
  if (raw === 'paused') return 'paused'
  if (input.isDraft) return 'draft'
  if (raw === 'inactive') return 'inactive'
  if (raw === 'active') return 'active'
  if (raw === 'draft') return input.isPublic === false ? 'inactive' : 'active'
  if (input.isPublic === false || input.isActive === false) return 'inactive'
  return 'active'
}

export function isCardSuspended(status?: string | null): boolean {
  return resolveCardStatus({ status }) === 'suspended'
}

export function isCardPaused(status?: string | null): boolean {
  return resolveCardStatus({ status }) === 'paused'
}

export function isOwnerCardLocked(status?: string | null): boolean {
  return isCardSuspended(status)
}

export const SUSPENDED_CARD_MESSAGE = 'This card is suspended. Contact an administrator to restore access.'
export const PAUSED_CARD_MESSAGE = 'This card is paused by an administrator and cannot be made public.'
