import type {
  ReviewItem,
  ReviewListItem,
  ReviewsQueryResult,
  ReviewsSectionResponse,
} from '@/interfaces/api/reviews.interface'
import { isPublishedStatus, resolveFeaturedImageUrl } from '@/lib/api/resolveFeaturedImageUrl'
import { decodeHtmlText, stripHtml } from '@/lib/htmlText'

function toPlainDescription(description: string | null): { plain: string; html: string } {
  const html = description?.trim() ?? ''
  if (!html) return { plain: '', html: '' }
  return { plain: stripHtml(html), html }
}

function normalizeRating(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return 5
  return Math.min(5, Math.max(1, Math.round(n)))
}

export function sanitizeReviewUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  try {
    const url = new URL(raw.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function rawReviewUrl(item: ReviewItem): string {
  return (
    (typeof item.reviewUrl === 'string' ? item.reviewUrl.trim() : '') ||
    (typeof item.review_link?.url === 'string' ? item.review_link.url.trim() : '') ||
    (typeof item.general_info_url === 'string' ? item.general_info_url.trim() : '')
  )
}

function reviewTitle(item: ReviewItem): string {
  return (
    (typeof item.author === 'string' ? item.author.trim() : '') ||
    (typeof item.title === 'string' ? item.title.trim() : '')
  )
}

function reviewDescription(item: ReviewItem): string | null {
  const text = typeof item.text === 'string' ? item.text : ''
  if (text.trim()) return text
  return typeof item.description === 'string' ? item.description : null
}

function normalizedLabel(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().toLowerCase() : ''
}

function isLeaveReviewItem(item: ReviewItem): boolean {
  if (normalizedLabel(item.author) === 'leave a review' || normalizedLabel(item.title) === 'leave a review') return true

  const hasContent = Boolean(reviewTitle(item) || reviewDescription(item)?.trim())
  return !hasContent && Boolean(rawReviewUrl(item))
}

export function mapReviewItemToListItem(item: ReviewItem): ReviewListItem {
  const linkUrl = sanitizeReviewUrl(rawReviewUrl(item))
  const { plain, html } = toPlainDescription(reviewDescription(item))
  const isLinkCard = isLeaveReviewItem(item)
  return {
    id: item.id,
    title: decodeHtmlText(reviewTitle(item) || (isLinkCard ? 'Leave a Review' : 'Reviewer')),
    plainDescription: plain,
    htmlDescription: html,
    image:
      (typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '') || resolveFeaturedImageUrl(item.featured_image),
    linkUrl,
    isLinkCard,
    rating: normalizeRating(item.rating),
  }
}

export function buildReviewsQueryResult(reviewItems: ReviewItem[], sectionTitle = 'Reviews'): ReviewsQueryResult {
  const items = reviewItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isPublishedStatus(item.status))
    .sort((a, b) => {
      const aOrder = typeof a.item.sortOrder === 'number' ? a.item.sortOrder : a.index
      const bOrder = typeof b.item.sortOrder === 'number' ? b.item.sortOrder : b.index
      return aOrder - bOrder || a.index - b.index
    })
    .map(({ item }) => mapReviewItemToListItem(item))

  const linkCards = items.filter((item) => item.isLinkCard)
  const reviews = items.filter((item) => !item.isLinkCard)
  const averageRating =
    reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0

  return {
    sectionTitle: decodeHtmlText(sectionTitle),
    slides: reviews,
    leaveReviewUrl: linkCards.find((item) => item.linkUrl)?.linkUrl ?? null,
    reviewCount: reviews.length,
    averageRating,
  }
}

export function normalizeReviewsResponse(response: ReviewsSectionResponse): ReviewsQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load reviews')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Reviews'
  return buildReviewsQueryResult(response.data.items ?? [], sectionTitle)
}
