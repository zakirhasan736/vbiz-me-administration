import type {
  ClientItem,
  ClientListItem,
  ClientsQueryResult,
  ClientsSectionResponse,
} from '@/interfaces/api/clients.interface'

function formatPartnerSince(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return String(date.getFullYear())
}

export function mapClientItemToListItem(item: ClientItem): ClientListItem {
  const linkUrl = item.review_link?.has_link && item.review_link.url?.trim() ? item.review_link.url.trim() : null

  return {
    id: item.id,
    name: item.title.trim() || 'Client',
    logo: item.featured_image?.trim() ?? '',
    since: formatPartnerSince(item.created_at),
    description: item.description?.trim() ?? '',
    linkUrl,
  }
}

export function normalizeClientsResponse(response: ClientsSectionResponse): ClientsQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load clients')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Clients'

  const clients = (response.data.items ?? []).filter((item) => item.status === 1).map(mapClientItemToListItem)

  return { sectionTitle, clients }
}
