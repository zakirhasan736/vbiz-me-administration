import type {
  VideoListItem,
  VideoSectionItem,
  VideoSectionResponse,
  VideosQueryResult,
} from '@/interfaces/api/videos.interface'
import { encodeMediaUrl } from '@/lib/mediaUrl'

function mapGalleryImages(item: VideoSectionItem): string[] {
  return (item.gallery?.images ?? [])
    .map((image) => (image.url?.trim() ? encodeMediaUrl(image.url) : ''))
    .filter((url) => url.length > 0)
}

function mapVideoItem(item: VideoSectionItem, idx: number): VideoListItem {
  const featuredImage = item.featured_image?.url?.trim() ? encodeMediaUrl(item.featured_image.url) : ''
  const galleryImages = mapGalleryImages(item)
  const galleryCount = item.gallery?.total_images ?? galleryImages.length

  return {
    id: `${item.created_at}-${idx}`,
    title: item.title?.trim() || 'Untitled',
    type: item.type?.trim().toLowerCase() || 'video',
    createdAt: item.created_at,
    featuredImage,
    galleryCount,
    galleryImages,
  }
}

export function normalizeVideosResponse(response: VideoSectionResponse): VideosQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load videos')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Video'
  const items = (response.data.items ?? []).map(mapVideoItem)

  return { sectionTitle, items }
}
