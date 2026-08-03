import type {
  VideoExplainerQueryResult,
  VideoExplainerSectionResponse,
} from '@/interfaces/api/videoExplainer.interface'
import { encodeMediaUrl } from '@/lib/mediaUrl'

export function normalizeVideoExplainerResponse(response: VideoExplainerSectionResponse): VideoExplainerQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load video explainer')
  }

  const sectionTitle = response.post_type?.title?.trim() || '2D Video Explainer'
  const videoUrl = encodeMediaUrl(response.data.video?.url ?? '')
  const videoName = response.data.video?.doc_name?.trim() ?? ''
  const externalUrl =
    response.data.external_url?.has_external_url && response.data.external_url.url?.trim()
      ? encodeMediaUrl(response.data.external_url.url)
      : null

  return {
    sectionTitle,
    videoUrl,
    videoName,
    externalUrl,
  }
}
