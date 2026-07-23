import type { VCardGeneralPost } from '@/types/vcard'

export function createDefaultGeneralPost(): VCardGeneralPost {
  return {
    id: `post_${Date.now()}`,
    category: '',
    title: '',
    description: '',
    customUrl: '',
    featuredImage: '',
    date: '',
    active: true,
  }
}

export function normalizeGeneralPostList(raw?: VCardGeneralPost[] | null): VCardGeneralPost[] {
  if (!raw?.length) return []
  return raw.map((entry) => ({
    id: entry.id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category: entry.category ?? '',
    title: entry.title ?? '',
    description: entry.description ?? '',
    customUrl: entry.customUrl ?? '',
    featuredImage: entry.featuredImage ?? '',
    date: entry.date ?? '',
    active: entry.active !== false,
  }))
}

/** Active posts with at least a title or description — shown on the public profile Blog tab. */
export function getPublishedGeneralPosts(entries: VCardGeneralPost[]): VCardGeneralPost[] {
  return entries.filter((e) => e.active && (e.title.trim().length > 0 || e.description.trim().length > 0))
}

export function formatGeneralPostDate(isoDate: string): string {
  const trimmed = isoDate.trim()
  if (!trimmed) return ''
  const parsed = new Date(trimmed.includes('T') ? trimmed : `${trimmed}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return trimmed
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
