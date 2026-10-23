import { getFieldConfig, isFieldVisible } from '@/lib/vcardDisplaySettings'
import { extractYoutubeVideoId } from '@/lib/youtubeEmbed'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import type { MyCardBackgroundAudio } from '@interfaces/api/myCard'

/**
 * Build public background-audio payload from Card Settings → Home Media display fields.
 * Prefer this for live builder preview so uploads play without waiting on a myCard refetch.
 */
export function audioFromDisplaySettings(
  settings: VCardDisplaySettings | null | undefined
): MyCardBackgroundAudio | null {
  if (!settings) return null

  // Play whenever a Home Media music URL is set (file or YouTube), including after a YouTube intro.
  const fileUrl = getFieldConfig(settings, 'Background Music').customValue?.trim() || ''
  const ytUrl = getFieldConfig(settings, 'YouTube Background Music Link').customValue?.trim() || ''
  const repeat = isFieldVisible(settings, 'Repeat Background Music') !== false

  if (!fileUrl && !ytUrl) return null

  if (fileUrl && !extractYoutubeVideoId(fileUrl)) {
    return {
      enabled: true,
      url: fileUrl,
      use_youtube_link: false,
      repeat,
    }
  }

  const videoId = extractYoutubeVideoId(ytUrl) || extractYoutubeVideoId(fileUrl)
  if (videoId) {
    const link = ytUrl || fileUrl
    return {
      enabled: true,
      use_youtube_link: true,
      youtube: {
        link,
        video_id: videoId,
        embed_url: `https://www.youtube.com/embed/${videoId}`,
      },
      repeat,
    }
  }

  return null
}
