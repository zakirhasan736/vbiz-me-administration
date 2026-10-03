import { stripHtml } from '@/lib/htmlText'
import type { VCardReviewEntry } from '@/types/vcard'

export function createDefaultReviewEntry(): VCardReviewEntry {
  return {
    id: `rev_${Date.now()}`,
    author: '',
    rating: 5,
    text: '',
    imageUrl: '',
    url: '',
  }
}

export function normalizeReviewList(raw?: VCardReviewEntry[] | null): VCardReviewEntry[] {
  if (!raw?.length) return []
  return raw.map((entry) => {
    const rawRating = typeof entry.rating === 'number' ? entry.rating : Number(entry.rating)
    const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 5
    return {
      id: entry.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      author: entry.author ?? '',
      rating,
      text: entry.text ?? '',
      imageUrl: entry.imageUrl ?? '',
      url: entry.url ?? '',
    }
  })
}

function normalizedLabel(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().toLowerCase() : ''
}

/** Matches public-card CTA detection: titled “Leave a Review”, or URL-only rows. */
export function isLeaveReviewEntry(entry: VCardReviewEntry): boolean {
  if (normalizedLabel(entry.author) === 'leave a review') return true
  const hasContent = Boolean(entry.author?.trim() || stripHtml(entry.text || '').trim())
  return !hasContent && Boolean(entry.url?.trim())
}

/** First leave-a-review CTA URL from the reviews list (legacy placement). */
export function extractLeaveReviewUrlFromList(raw?: VCardReviewEntry[] | null): string {
  for (const entry of normalizeReviewList(raw)) {
    if (!isLeaveReviewEntry(entry)) continue
    const url = entry.url?.trim()
    if (url) return url
  }
  return ''
}

/** Drop legacy leave-a-review CTA rows once the URL lives on the banner. */
export function withoutLeaveReviewEntries(raw?: VCardReviewEntry[] | null): VCardReviewEntry[] {
  return normalizeReviewList(raw).filter((entry) => !isLeaveReviewEntry(entry))
}
