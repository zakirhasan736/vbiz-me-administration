const GUEST_ID_STORAGE_KEY = 'vbiz_guest_id'
const GUEST_ID_COOKIE = 'vbiz_guest_id'

function readGuestCookie(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${GUEST_ID_COOKIE}=`))
  return match ? decodeURIComponent(match.slice(GUEST_ID_COOKIE.length + 1)).trim() : ''
}

function writeGuestCookie(id: string) {
  if (typeof document === 'undefined' || !id) return
  document.cookie = `${GUEST_ID_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 400}; samesite=lax`
}

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
    const fromCookie = readGuestCookie()
    if (fromCookie) {
      window.localStorage.setItem(GUEST_ID_STORAGE_KEY, fromCookie)
      return fromCookie
    }
    const next = createGuestId()
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, next)
    writeGuestCookie(next)
    return next
  } catch {
    const fallback = readGuestCookie() || createGuestId()
    writeGuestCookie(fallback)
    return fallback
  }
}
