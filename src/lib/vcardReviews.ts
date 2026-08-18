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
