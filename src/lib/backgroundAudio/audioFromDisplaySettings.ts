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

  const fileVisible = isFieldVisible(settings, 'Background Music')
  const ytVisible = isFieldVisible(settings, 'YouTube Background Music Link')
  const fileUrl = fileVisible ? getFieldConfig(settings, 'Background Music').customValue?.trim() || '' : ''
  const ytUrl = ytVisible ? getFieldConfig(settings, 'YouTube Background Music Link').customValue?.trim() || '' : ''
  const repeatVisible = isFieldVisible(settings, 'Repeat Background Music')
  const repeat = repeatVisible !== false

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
