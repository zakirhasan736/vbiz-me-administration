/** Member-only card settings. The owner card and other team cards do not receive these. */
export const HIDE_OWNER_PHOTOS_SETTING_KEY = 'hide_owner_photos'
export const HIDE_OWNER_VIDEOS_SETTING_KEY = 'hide_owner_videos'

export function isHideOwnerMediaSetting(value: string | null | undefined): boolean {
  const normalized = (value || '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export function withoutCorporateOwned<T extends { corporateOwned?: boolean }>(items: T[], hideOwner: boolean): T[] {
  if (!hideOwner) return items
  return items.filter((item) => !item.corporateOwned)
}

/** Keep owner rows in the saved list while the editor shows only the member's own items. */
export function mergeHiddenCorporateOwned<T extends { corporateOwned?: boolean }>(full: T[], visibleNext: T[]): T[] {
  const hidden = full.filter((item) => item.corporateOwned)
  const visible = visibleNext.filter((item) => !item.corporateOwned)
  return [...hidden, ...visible]
}

/** Member-only. Owner sync does not copy this, so a member's tab choices stay on their card. */
export const MEMBER_NAV_CUSTOMIZED_SETTING_KEY = 'member_nav_customized'

/** Per owner photo or video the member hid from their public card. */
export const HIDDEN_OWNER_MEDIA_SETTING_KEY = 'hidden_owner_media_json'

export type HiddenOwnerMediaEntry = { id: string; fingerprint: string }

export type HiddenOwnerMediaLists = {
  photos: HiddenOwnerMediaEntry[]
  videos: HiddenOwnerMediaEntry[]
}

export type OwnerMediaFingerprintRow = {
  id: string
  title?: string | null
  description?: string | null
  text?: string | null
  url?: string | null
  imageUrl?: string | null
  featuredImage?: string | null
}

export function ownerMediaFingerprint(row: Omit<OwnerMediaFingerprintRow, 'id'>): string {
  return [row.title, row.description, row.text, row.url, row.featuredImage, row.imageUrl]
    .map((value) => (value == null ? '' : String(value).trim().toLowerCase()))
    .filter(Boolean)
    .join('|')
}

function readHiddenEntries(value: unknown): HiddenOwnerMediaEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const row = entry as { id?: unknown; fingerprint?: unknown }
    const id = typeof row.id === 'string' ? row.id.trim() : ''
    const fingerprint = typeof row.fingerprint === 'string' ? row.fingerprint.trim() : ''
    if (!id && !fingerprint) return []
    return [{ id, fingerprint }]
  })
}

export function parseHiddenOwnerMedia(raw: string | null | undefined): HiddenOwnerMediaLists {
  if (!raw?.trim()) return { photos: [], videos: [] }
  try {
    const parsed = JSON.parse(raw) as { photos?: unknown; videos?: unknown }
    return { photos: readHiddenEntries(parsed.photos), videos: readHiddenEntries(parsed.videos) }
  } catch {
    return { photos: [], videos: [] }
  }
}

export function hiddenOwnerMediaMatches(
  entries: readonly HiddenOwnerMediaEntry[],
  row: OwnerMediaFingerprintRow
): boolean {
  const fingerprint = ownerMediaFingerprint(row)
  return entries.some(
    (entry) => (entry.id && entry.id === row.id) || (fingerprint && entry.fingerprint === fingerprint)
  )
}

export function toggleHiddenOwnerMedia(
  entries: readonly HiddenOwnerMediaEntry[],
  row: OwnerMediaFingerprintRow
): HiddenOwnerMediaEntry[] {
  const fingerprint = ownerMediaFingerprint(row)
  if (hiddenOwnerMediaMatches(entries, row)) {
    return entries.filter((entry) => entry.id !== row.id && (!fingerprint || entry.fingerprint !== fingerprint))
  }
  return [...entries, { id: row.id, fingerprint }]
}

/** Public preview: drop owner rows the member hid, and every owner row when the bulk checkbox is on. */
export function withoutHiddenOwnerMedia<T extends OwnerMediaFingerprintRow & { corporateOwned?: boolean }>(
  items: T[],
  entries: readonly HiddenOwnerMediaEntry[],
  hideAll: boolean
): T[] {
  return items.filter((item) => {
    if (!item.corporateOwned) return true
    if (hideAll) return false
    return !hiddenOwnerMediaMatches(entries, item)
  })
}
