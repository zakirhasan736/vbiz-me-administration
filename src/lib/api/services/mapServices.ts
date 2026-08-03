import type {
  ServiceItem,
  ServiceListItem,
  ServicesQueryResult,
  ServicesSectionResponse,
} from '@/interfaces/api/services.interface'

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

export function mapServiceItemToListItem(item: ServiceItem): ServiceListItem {
  const { plain, html } = toPlainDescription(item.description)
  const url = item.review_link?.has_link && item.review_link.url?.trim() ? item.review_link.url.trim() : ''

  return {
    id: item.id,
    title: item.title.trim() || 'Service',
    description: plain,
    htmlDescription: html,
    featuredImage: item.featured_image?.trim() ?? '',
    url,
  }
}

export function normalizeServicesResponse(response: ServicesSectionResponse): ServicesQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load services')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Services'

  const services = (response.data.items ?? []).filter((item) => item.status === 1).map(mapServiceItemToListItem)

  return { sectionTitle, services }
}
