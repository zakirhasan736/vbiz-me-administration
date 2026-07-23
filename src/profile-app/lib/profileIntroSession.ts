const STORAGE_PREFIX = 'vbiz_profile_intro_seen_'

/** In-memory cache so intro state survives client navigations without waiting on storage. */
const seenInMemory = new Set<string>()

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug.trim().toLowerCase()}`
}

export function hasSeenProfileIntro(slug: string | undefined): boolean {
  if (!slug?.trim()) return false
  const key = slug.trim().toLowerCase()
  if (seenInMemory.has(key)) return true
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(storageKey(key)) === '1'
  } catch {
    return seenInMemory.has(key)
  }
}

export function markProfileIntroSeen(slug: string | undefined): void {
  if (!slug?.trim()) return
  const key = slug.trim().toLowerCase()
  seenInMemory.add(key)
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(storageKey(key), '1')
  } catch {
    /* ignore quota / private mode */
  }
}
