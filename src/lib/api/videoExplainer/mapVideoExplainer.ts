import type {
  VideoExplainerQueryResult,
  VideoExplainerSectionResponse,
} from '@/interfaces/api/videoExplainer.interface'
import { encodeMediaUrl } from '@/lib/mediaUrl'

export function normalizeVideoExplainerResponse(response: VideoExplainerSectionResponse): VideoExplainerQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load video explainer')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.type?.trim() || '2D Video Explainer'
  const fromVideo = encodeMediaUrl(response.data.video?.url ?? '')
  const items = (
    response.data as {
      items?: Array<{
        featured_image?: unknown
        general_info_url?: string | null
        video_url?: string | null
        title?: string | null
      }>
    }
  ).items
  const first = items?.[0]
  const fromItem =
    encodeMediaUrl(String(first?.video_url || '')) ||
    (typeof first?.featured_image === 'string' ? encodeMediaUrl(first.featured_image) : '') ||
    (first?.featured_image && typeof first.featured_image === 'object'
      ? encodeMediaUrl(String((first.featured_image as { url?: string }).url || ''))
      : '')
  const videoUrl = fromVideo || fromItem
  const videoName = response.data.video?.doc_name?.trim() || first?.title?.trim() || ''
  const externalFromApi =
    response.data.external_url?.has_external_url && response.data.external_url.url?.trim()
      ? encodeMediaUrl(response.data.external_url.url)
      : null
  const externalFromItem =
    first?.general_info_url?.trim() && first.general_info_url !== videoUrl ? first.general_info_url : null

  return {
    sectionTitle,
    videoUrl,
    videoName,
    externalUrl: externalFromApi || externalFromItem,
  }
}
