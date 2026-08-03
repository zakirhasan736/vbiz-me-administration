/** In-memory only — intro replays on every full page reload, not on in-app section changes. */
const seenInMemory = new Set<string>()

export function hasSeenProfileIntro(slug: string | undefined): boolean {
  if (!slug?.trim()) return false
  return seenInMemory.has(slug.trim().toLowerCase())
}

export function markProfileIntroSeen(slug: string | undefined): void {
  if (!slug?.trim()) return
  seenInMemory.add(slug.trim().toLowerCase())
}
