export type CreateCardOwnerSession = {
  userId: string
  name: string
  email: string
  role: 'vcard-owner' | 'corporate-owner' | string
  /** Optional — Users accounts may not store phone; AI can fill from sources if blank. */
  phone?: string
}

/** Personal identity already on the Users account — AI/custom builder must not invent a different login email. */
export type AccountOwnerPersonalSeed = {
  fullName: string
  email: string
  phone: string
}

export type AccountOwnerIdentityInput = {
  name?: string | null
  email?: string | null
  phone?: string | null
}

export function accountOwnerPersonalSeed(owner?: AccountOwnerIdentityInput | null): AccountOwnerPersonalSeed | null {
  if (!owner) return null
  const email = typeof owner.email === 'string' ? owner.email.trim() : ''
  const fullName = typeof owner.name === 'string' ? owner.name.trim() : ''
  const phone = typeof owner.phone === 'string' ? owner.phone.trim() : ''
  if (!email && !fullName && !phone) return null
  return { fullName, email, phone }
}

/** Merge account identity into a draft personal block without wiping AI-filled marketing fields. */
export function mergeAccountOwnerIntoPersonal<T extends object>(
  personal: T | undefined,
  owner?: AccountOwnerIdentityInput | null
): T {
  const seed = accountOwnerPersonalSeed(owner)
  const base = { ...(personal || {}) } as T
  if (!seed) return base
  if (seed.email) (base as Record<string, unknown>).email = seed.email
  if (seed.fullName && !String((base as Record<string, unknown>).fullName || '').trim()) {
    ;(base as Record<string, unknown>).fullName = seed.fullName
  }
  if (seed.phone && !String((base as Record<string, unknown>).phone || '').trim()) {
    ;(base as Record<string, unknown>).phone = seed.phone
  }
  return base
}

const STORAGE_KEY = 'vbiz.createCardOwner'

export function setCreateCardOwner(owner: CreateCardOwnerSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(owner))
  } catch {
    /* ignore quota / private mode */
  }
}

export function getCreateCardOwner(): CreateCardOwnerSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CreateCardOwnerSession>
    if (!parsed?.userId || typeof parsed.userId !== 'string') return null
    return {
      userId: parsed.userId,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      role: typeof parsed.role === 'string' ? parsed.role : '',
    }
  } catch {
    return null
  }
}

export function clearCreateCardOwner(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function normalizeOwnerRole(role: string): string {
  return role.trim().toLowerCase().replace(/_/g, '-')
}

/** Banner subtitle for the assigned create-card owner. */
export function createCardOwnerKindLabel(owner: CreateCardOwnerSession, currentUserId?: string | null): string {
  const role = normalizeOwnerRole(owner.role)
  if (role === 'corporate-owner') return 'Corporate Team Owner'
  if (role === 'vcard-owner') return 'Single owner'
  if (role === 'admin' || role === 'super-admin') {
    return currentUserId && owner.userId === currentUserId ? 'You' : 'Team member'
  }
  return 'Single owner'
}
