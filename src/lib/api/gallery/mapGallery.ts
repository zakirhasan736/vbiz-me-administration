import type {
  GalleryImageAsset,
  GalleryItem,
  GalleryListItem,
  GalleryQueryResult,
  GallerySectionResponse,
} from '@/interfaces/api/gallery.interface'
import { decodeHtmlText } from '@/lib/htmlText'

function assetFromUnknown(value: unknown): GalleryImageAsset | null {
  if (typeof value === 'string') {
    const url = value.trim()
    return url ? { id: url, doc_name: 'Gallery', url } : null
  }

  if (!value || typeof value !== 'object') return null

  const record = value as { id?: string | number; doc_name?: string; url?: string }
  const url = record.url?.trim() ?? ''
  if (!url) return null

  return {
    id: record.id ?? url,
    doc_name: decodeHtmlText(record.doc_name?.trim() || 'Gallery'),
    url,
  }
}

/** Resolve Laravel-style array, single object, or string featured_image. */
function resolveFeaturedImage(item: GalleryItem): GalleryImageAsset | null {
  const featured = item.featured_image

  if (Array.isArray(featured)) {
    for (const entry of featured) {
      const asset = assetFromUnknown(entry)
      if (asset) return asset
    }
  } else {
    const asset = assetFromUnknown(featured)
    if (asset) return asset
  }

  const gallery = item.gallery
  if (Array.isArray(gallery)) {
    for (const entry of gallery) {
      const asset = assetFromUnknown(entry)
      if (asset) return asset
    }
  }

  return null
}

export function mapGalleryItemToListItem(item: GalleryItem, index = 0): GalleryListItem | null {
  const featured = resolveFeaturedImage(item)
  if (!featured?.url?.trim()) return null

  const rawTitle = item.title?.trim() || ''

  return {
    id: item.id ?? featured.id ?? index + 1,
    title: decodeHtmlText(rawTitle || featured.doc_name || 'Gallery'),
    imageUrl: featured.url.trim(),
    createdAt: item.created_at ?? '',
  }
}

export function normalizeGalleryResponse(response: GallerySectionResponse): GalleryQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load gallery')
  }

  const sectionTitle = decodeHtmlText(
    response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Gallery'
  )

  const items = (response.data.items ?? [])
    .map((item, index) => mapGalleryItemToListItem(item, index))
    .filter((item): item is GalleryListItem => item !== null)

  return { sectionTitle, items }
}
