const STORAGE_KEY = 'vbiz.colorPicker.recent'
const MAX_RECENT = 8

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readRecentColors(): string[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is string => typeof item === 'string' && /^#[0-9a-f]{6}$/i.test(item))
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function rememberRecentColor(hex: string): string[] {
  const next = [
    hex.toLowerCase(),
    ...readRecentColors().filter((item) => item.toLowerCase() !== hex.toLowerCase()),
  ].slice(0, MAX_RECENT)
  if (!canUseStorage()) return next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private mode and blocked storage still keep the in-memory list.
  }
  return next
}
