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
