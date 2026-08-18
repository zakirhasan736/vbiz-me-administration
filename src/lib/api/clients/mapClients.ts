import type {
  ClientItem,
  ClientListItem,
  ClientsQueryResult,
  ClientsSectionResponse,
} from '@/interfaces/api/clients.interface'

function formatPartnerSince(createdAt?: string): string {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return String(date.getFullYear())
}

function resolveLogo(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = resolveLogo(entry)
      if (url) return url
    }
    return ''
  }
  if (value && typeof value === 'object') return String((value as { url?: string }).url ?? '').trim()
  return ''
}

function isPublished(status: unknown): boolean {
  if (status === undefined || status === null || status === '') return true
  if (status === 1 || status === true) return true
  const normalized = String(status).trim().toLowerCase()
  return normalized === '1' || normalized === 'active' || normalized === 'true'
}

export function mapClientItemToListItem(item: ClientItem): ClientListItem {
  const linkUrl = item.review_link?.has_link && item.review_link.url?.trim() ? item.review_link.url.trim() : null
  const logo = resolveLogo(item.featured_image) || resolveLogo(item.attachments)

  return {
    id: item.id,
    name: item.title.trim() || 'Client',
    logo,
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

  const clients = (response.data.items ?? []).filter((item) => isPublished(item.status)).map(mapClientItemToListItem)

  return { sectionTitle, clients }
}
