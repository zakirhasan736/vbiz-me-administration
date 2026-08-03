import type {
  GalleryItem,
  GalleryListItem,
  GalleryQueryResult,
  GallerySectionResponse,
} from '@/interfaces/api/gallery.interface'

export function mapGalleryItemToListItem(item: GalleryItem): GalleryListItem | null {
  const imageUrl = item.featured_image?.url?.trim()
  if (!imageUrl) return null

  return {
    id: item.featured_image!.id,
    title: item.title?.trim() || 'Gallery',
    imageUrl,
    createdAt: item.created_at,
  }
}

export function normalizeGalleryResponse(response: GallerySectionResponse): GalleryQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load gallery')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Gallery'

  const items = (response.data.items ?? [])
    .map(mapGalleryItemToListItem)
    .filter((item): item is GalleryListItem => item !== null)

  return { sectionTitle, items }
}
