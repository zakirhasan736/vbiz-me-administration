import type {
  ServiceItem,
  ServiceListItem,
  ServicesQueryResult,
  ServicesSectionResponse,
} from '@/interfaces/api/services.interface'
import { isPublishedStatus } from '@/lib/api/resolveFeaturedImageUrl'
import { encodeMediaUrl, isUsableImageSrc } from '@/lib/mediaUrl'

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

/** Node returns string | null; some payloads use [{ url }] like gallery/posts. */
function resolveFeaturedImageUrl(value: unknown): string {
  if (typeof value === 'string') {
    const url = value.trim()
    return isUsableImageSrc(url) ? encodeMediaUrl(url) : ''
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = resolveFeaturedImageUrl(entry)
      if (url) return url
    }
    return ''
  }
  if (value && typeof value === 'object') {
    const url = String((value as { url?: string }).url ?? '').trim()
    return isUsableImageSrc(url) ? encodeMediaUrl(url) : ''
  }
  return ''
}

export function mapServiceItemToListItem(item: ServiceItem): ServiceListItem {
  const { plain, html } = toPlainDescription(item.description)
  const url = item.review_link?.has_link && item.review_link.url?.trim() ? item.review_link.url.trim() : ''

  return {
    id: item.id,
    title: item.title.trim() || 'Service',
    description: plain,
    htmlDescription: html,
    featuredImage: resolveFeaturedImageUrl(item.featured_image),
    url,
  }
}

export function normalizeServicesResponse(response: ServicesSectionResponse): ServicesQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load services')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Services'

  const services = (response.data.items ?? [])
    .filter((item) => isPublishedStatus(item.status))
    .map(mapServiceItemToListItem)

  return { sectionTitle, services }
}
