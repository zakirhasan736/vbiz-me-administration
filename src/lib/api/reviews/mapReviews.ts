import type {
  ReviewItem,
  ReviewListItem,
  ReviewsQueryResult,
  ReviewsSectionResponse,
} from '@/interfaces/api/reviews.interface'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toPlainDescription(description: string | null): { plain: string; html: string } {
  const html = description?.trim() ?? ''
  if (!html) return { plain: '', html: '' }
  return { plain: stripHtml(html), html }
}

function linkCardSortWeight(item: ReviewListItem): number {
  const title = item.title.toLowerCase()
  if (title.includes('leave')) return 0
  if (title.includes('write') || title.includes('read')) return 1
  return 2
}

export function mapReviewItemToListItem(item: ReviewItem): ReviewListItem {
  const linkUrl = item.review_link?.has_link && item.review_link.url?.trim() ? item.review_link.url.trim() : null
  const { plain, html } = toPlainDescription(item.description)
  const isLinkCard = Boolean(linkUrl)

  return {
    id: item.id,
    title: item.title.trim() || (isLinkCard ? 'Leave a Review' : 'Review'),
    plainDescription: plain,
    htmlDescription: html,
    image: item.featured_image?.trim() ?? '',
    linkUrl,
    isLinkCard,
  }
}

export function normalizeReviewsResponse(response: ReviewsSectionResponse): ReviewsQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load reviews')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Reviews'

  const items = (response.data.items ?? []).filter((item) => item.status === 1).map(mapReviewItemToListItem)

  const linkCards = items
    .filter((item) => item.isLinkCard)
    .sort((a, b) => linkCardSortWeight(a) - linkCardSortWeight(b))
  const reviews = items.filter((item) => !item.isLinkCard)
  const slides = [...linkCards, ...reviews]

  return {
    sectionTitle,
    slides,
    leaveReviewUrl: linkCards[0]?.linkUrl ?? null,
    reviewCount: reviews.length,
  }
}
