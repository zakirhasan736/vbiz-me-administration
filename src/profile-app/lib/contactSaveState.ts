import { getOrCreateGuestId } from '@/profile-app/lib/guestId'

const CONTACT_SAVE_PREFIX = 'vbiz_contact_saved_'

export type ContactSaveState = {
  savedAt: string
  guestId: string
  email?: string
  fullName?: string
  phone?: string
}

function storageKey(profileId: string): string {
  return `${CONTACT_SAVE_PREFIX}${profileId.trim()}`
}

export function readContactSaveState(profileId: string): ContactSaveState | null {
  const id = profileId.trim()
  if (!id || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(id))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ContactSaveState
    if (!parsed?.savedAt) return null
    return parsed
  } catch {
    return null
  }
}

export function hasSavedContact(profileId: string): boolean {
  return Boolean(readContactSaveState(profileId))
}

export function markContactSaved(
  profileId: string,
  details?: { email?: string; fullName?: string; phone?: string; guestId?: string }
): void {
  const id = profileId.trim()
  if (!id || typeof window === 'undefined') return
  const existing = readContactSaveState(id)
  const next: ContactSaveState = {
    savedAt: new Date().toISOString(),
    guestId: details?.guestId?.trim() || existing?.guestId || getOrCreateGuestId(),
    ...(details?.email?.trim() ? { email: details.email.trim() } : existing?.email ? { email: existing.email } : {}),
    ...(details?.fullName?.trim()
      ? { fullName: details.fullName.trim() }
      : existing?.fullName
        ? { fullName: existing.fullName }
        : {}),
    ...(details?.phone?.trim() ? { phone: details.phone.trim() } : existing?.phone ? { phone: existing.phone } : {}),
  }
  try {
    window.localStorage.setItem(storageKey(id), JSON.stringify(next))
  } catch {
    /* private mode / quota */
  }
}

/** Guest identity from a prior Save Contact on this card (local). */
export function readSavedGuestContact(profileId: string): {
  fullName: string
  email: string
  phone: string
  lockName: boolean
  lockEmail: boolean
  lockPhone: boolean
} | null {
  const saved = readContactSaveState(profileId)
  if (!saved) return null
  const fullName = saved.fullName?.trim() || ''
  const email = saved.email?.trim() || ''
  const phone = saved.phone?.trim() || ''
  if (!fullName && !email && !phone) return null
  return {
    fullName,
    email,
    phone,
    lockName: Boolean(fullName),
    lockEmail: Boolean(email),
    lockPhone: Boolean(phone),
  }
}
