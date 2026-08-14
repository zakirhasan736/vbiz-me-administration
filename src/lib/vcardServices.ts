import type { VCardServiceEntry } from '@/types/vcard'

/** Matches the Services editor dropdown — AI fill must use these exact values. */
export const SERVICE_TYPE_OPTIONS = ['Web Development', 'App Design', 'SEO', 'Marketing', 'Other'] as const

export type ServiceTypeOption = (typeof SERVICE_TYPE_OPTIONS)[number]

export function normalizeServiceType(raw?: string | null): ServiceTypeOption {
  const value = String(raw || '').trim()
  if (!value) return 'Other'
  const exact = SERVICE_TYPE_OPTIONS.find((opt) => opt.toLowerCase() === value.toLowerCase())
  if (exact) return exact
  const lower = value.toLowerCase()
  if (/web|frontend|backend|full.?stack|wordpress|shopify/.test(lower)) return 'Web Development'
  if (/app|mobile|ios|android|ui.?ux|figma/.test(lower)) return 'App Design'
  if (/seo|search.?engine/.test(lower)) return 'SEO'
  if (/market|ads|social.?media|brand|content/.test(lower)) return 'Marketing'
  return 'Other'
}

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
