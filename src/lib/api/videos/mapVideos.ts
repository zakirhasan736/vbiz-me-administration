import type {
  VideoListItem,
  VideoSectionItem,
  VideoSectionResponse,
  VideosQueryResult,
} from '@/interfaces/api/videos.interface'
import { decodeHtmlText } from '@/lib/htmlText'
import { encodeMediaUrl } from '@/lib/mediaUrl'

function normalizeSafeUrl(value: string | null | undefined): string {
  const candidate = String(value || '')
    .trim()
    .replace(/&amp;/gi, '&')
  if (!candidate || candidate.startsWith('blob:')) return ''
  if (candidate.startsWith('/')) return candidate
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? candidate : ''
  } catch {
    return ''
  }
}

function mapGalleryImages(item: VideoSectionItem): string[] {
  return (item.gallery?.images ?? [])
    .map((image) => (image.url?.trim() ? encodeMediaUrl(image.url) : ''))
    .filter((url) => url.length > 0)
}

function resolveVideoUrl(item: VideoSectionItem): string {
  return (
    normalizeSafeUrl(item.video?.url) ||
    normalizeSafeUrl(item.video_url) ||
    normalizeSafeUrl(item.general_info_url) ||
    normalizeSafeUrl(item.url) ||
    normalizeSafeUrl(item.review_link?.url) ||
    ''
  )
}

function resolveFeaturedImage(item: VideoSectionItem): string {
  const featured = Array.isArray(item.featured_image) ? item.featured_image[0]?.url : item.featured_image?.url
  return featured?.trim() ? encodeMediaUrl(featured) : ''
}

function mapVideoItem(item: VideoSectionItem, idx: number): VideoListItem {
  const featuredImage = resolveFeaturedImage(item)
  const galleryImages = mapGalleryImages(item)
  const galleryCount = item.gallery?.total_images ?? galleryImages.length
  const id = item.id != null ? String(item.id) : `${item.created_at}-${idx}`

  return {
    id,
    title: decodeHtmlText(item.title?.trim() || 'Untitled'),
    description: decodeHtmlText(String(item.description || '').trim()),
    type: item.type?.trim().toLowerCase() || 'video',
    createdAt: item.created_at,
    featuredImage,
    videoUrl: resolveVideoUrl(item),
    galleryCount,
    galleryImages,
  }
}

export function normalizeVideosResponse(response: VideoSectionResponse): VideosQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load videos')
  }

  const sectionTitle = decodeHtmlText(
    response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'Video'
  )
  const items = (response.data.items ?? []).map(mapVideoItem)

  return { sectionTitle, items }
}
