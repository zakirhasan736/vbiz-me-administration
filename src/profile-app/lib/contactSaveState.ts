import { getOrCreateGuestId } from '@/profile-app/lib/guestId'

const CONTACT_SAVE_PREFIX = 'vbiz_contact_saved_'

export type ContactSaveState = {
  savedAt: string
  guestId: string
  email?: string
  fullName?: string
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
  details?: { email?: string; fullName?: string; guestId?: string }
): void {
  const id = profileId.trim()
  if (!id || typeof window === 'undefined') return
  const next: ContactSaveState = {
    savedAt: new Date().toISOString(),
    guestId: details?.guestId?.trim() || getOrCreateGuestId(),
    ...(details?.email?.trim() ? { email: details.email.trim() } : {}),
    ...(details?.fullName?.trim() ? { fullName: details.fullName.trim() } : {}),
  }
  try {
    window.localStorage.setItem(storageKey(id), JSON.stringify(next))
  } catch {
    /* private mode / quota */
  }
}
