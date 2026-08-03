import type {
  DynamicPostAttachment,
  DynamicPostItem,
  DynamicPostListItem,
  DynamicPostsQueryResult,
  DynamicPostsSectionResponse,
} from '@/interfaces/api/dynamicPosts.interface'

/** Treat missing status as published; accept common active flags. */
function isActiveItem(status: unknown): boolean {
  if (status === undefined || status === null || status === '') return true
  const normalized = String(status).trim().toLowerCase()
  if (normalized === '0' || normalized === 'false' || normalized === 'inactive' || normalized === 'draft') {
    return false
  }
  return (
    normalized === '1' ||
    normalized === 'active' ||
    normalized === 'true' ||
    normalized === 'published' ||
    normalized === 'enabled'
  )
}

function resolveFeaturedImage(image: unknown): { url: string; id?: number; docName?: string } {
  if (typeof image === 'string') {
    const url = image.trim()
    return url ? { url } : { url: '' }
  }
  if (image && typeof image === 'object') {
    const record = image as { url?: string; id?: number; doc_name?: string }
    const url = record.url?.trim() ?? ''
    return {
      url,
      id: typeof record.id === 'number' ? record.id : undefined,
      docName: record.doc_name?.trim() || undefined,
    }
  }
  return { url: '' }
}

function resolveAttachments(item: DynamicPostItem): DynamicPostAttachment[] {
  const fromApi = (item.attachments ?? []).filter((a) => a.url?.trim())
  const featured = resolveFeaturedImage(item.featured_image)
  if (featured.url && !fromApi.some((a) => a.url === featured.url)) {
    fromApi.unshift({
      id: featured.id ?? 0,
      doc_name: featured.docName ?? 'featured',
      attachment_type_id: 0,
      url: featured.url,
    })
  }
  return fromApi
}

export function mapDynamicPostItemToListItem(item: DynamicPostItem, index = 0): DynamicPostListItem {
  const featured = resolveFeaturedImage(item.featured_image)
  const attachments = resolveAttachments(item)
  const description =
    typeof item.description === 'string'
      ? item.description.trim()
      : item.description == null
        ? ''
        : String(item.description)

  return {
    id: typeof item.id === 'number' && item.id > 0 ? item.id : (featured.id ?? index + 1),
    title: item.title?.trim() || featured.docName || 'Update',
    description,
    featuredImage: featured.url,
    generalInfoUrl: item.general_info_url?.trim() ?? '',
    date: item.created_at ?? item.updated_at ?? '',
    attachments,
  }
}

function readItems(data: DynamicPostsSectionResponse['data']): DynamicPostItem[] {
  if (!data || typeof data !== 'object') return []
  const record = data as DynamicPostsSectionDataLoose
  const candidates = [record.items, record.posts, record.documents, record.licenses]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as DynamicPostItem[]
  }
  return []
}

type DynamicPostsSectionDataLoose = {
  items?: unknown
  posts?: unknown
  documents?: unknown
  licenses?: unknown
  postType?: { title?: string }
}

export function normalizeDynamicPostsResponse(
  response: DynamicPostsSectionResponse,
  fallbackTitle: string
): DynamicPostsQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || `Failed to load ${fallbackTitle.toLowerCase()}`)
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || fallbackTitle

  const posts = readItems(response.data)
    .filter((item) => isActiveItem(item?.status))
    .map((item, index) => mapDynamicPostItemToListItem(item, index))
    .filter((item) => item.title.trim() || item.featuredImage.trim() || item.description.trim())

  return { sectionTitle, posts }
}
