import type { VCardServiceEntry } from '@/types/vcard'

export function createDefaultServiceEntry(): VCardServiceEntry {
  return {
    id: `svc_${Date.now()}`,
    type: '',
    title: '',
    description: '',
    url: '',
    featuredImage: '',
    active: true,
  }
}

export function normalizeServiceList(raw?: VCardServiceEntry[] | null): VCardServiceEntry[] {
  if (!raw?.length) return []
  return raw.map((entry) => ({
    id: entry.id || `svc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: entry.type ?? '',
    title: entry.title ?? '',
    description: entry.description ?? '',
    url: entry.url ?? '',
    featuredImage: entry.featuredImage ?? '',
    active: entry.active !== false,
  }))
}

/** Active services with at least a title or description — shown on the public profile. */
export function getPublishedServiceEntries(entries: VCardServiceEntry[]): VCardServiceEntry[] {
  return entries.filter((e) => e.active && (e.title.trim().length > 0 || e.description.trim().length > 0))
}
