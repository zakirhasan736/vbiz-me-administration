import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

const ATTACHMENT_TYPE_TO_SETTING_KEY: Record<string, string> = {
  'Intro vCard Video': 'intro_video_url',
  'Intro YouTube vCard Video Link': 'intro_youtube_url',
  'Background Video/Image': 'background_media_url',
  'Profile Image/Video': 'profile_media_url',
  'Background Music': 'background_music_file_url',
  'YouTube Background Music Link': 'background_music_url',
  'Company/Office Icon': 'company_icon_url',
}

/**
 * Clears a card builder media field: setting URL → '', matching Attachment rows + S3 objects,
 * and Profile.avatar when clearing profile media.
 *
 * Always pass `url` for multi-item types (Service Featured, Blog Featured, Gallery, …).
 * The API requires it and only deletes that file — omitting url used to wipe every sibling
 * S3 object while list rows still pointed at those URLs (browser AccessDenied).
 */
export async function clearProfileMediaAttachment(options: {
  profileId: string
  attachmentType: string
  /** When set, only delete the attachment(s) with this URL (safe for shared type names). */
  url?: string | null
  signal?: AbortSignal
}): Promise<void> {
  const { profileId, attachmentType, url, signal } = options
  const trimmedType = attachmentType.trim()
  if (!profileId || !trimmedType) return

  const token = store.getState().user.token || ''
  const mediaUrl = typeof url === 'string' ? url.trim() : ''

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/media/clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      profileId,
      attachmentType: trimmedType,
      settingKey: ATTACHMENT_TYPE_TO_SETTING_KEY[trimmedType] || undefined,
      ...(mediaUrl && !mediaUrl.startsWith('blob:') ? { url: mediaUrl } : {}),
    }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to clear media (${res.status})`)
  }
}

export function mediaSettingKeyForAttachmentType(attachmentType: string): string | undefined {
  return ATTACHMENT_TYPE_TO_SETTING_KEY[attachmentType.trim()]
}
