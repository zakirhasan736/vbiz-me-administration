export type CreateCardOwnerSession = {
  userId: string
  name: string
  email: string
  role: 'vcard-owner' | 'corporate-owner' | string
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
  if (role === 'corporate-owner') return 'Corporate owner'
  if (role === 'vcard-owner') return 'Single owner'
  if (role === 'admin' || role === 'super-admin') {
    return currentUserId && owner.userId === currentUserId ? 'You' : 'Team member'
  }
  return 'Single owner'
}
