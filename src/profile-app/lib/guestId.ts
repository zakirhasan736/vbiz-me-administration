const GUEST_ID_STORAGE_KEY = 'vbiz_guest_id'

function createGuestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

/** Stable anonymous guest id for visit/social analytics (localStorage). */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY)?.trim()
    if (existing) return existing
    const next = createGuestId()
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, next)
    return next
  } catch {
    return createGuestId()
  }
}
