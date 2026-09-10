import { settingsRowsToMap } from '@/lib/api/myCard/hydrateDisplaySettingsFromProfile'
import { isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import type { ApiProfile } from '@/redux/features/profiles/profiles.api'

/** Header buttons need a still image — skip videos / invalid URLs. */
function asStillImage(url?: string | null): string {
  const trimmed = url?.trim() || ''
  if (!trimmed || isVideoUrl(trimmed) || !isUsableImageSrc(trimmed)) return ''
  return trimmed
}

function profileAvatarStill(profile: ApiProfile): string {
  const settings = settingsRowsToMap(profile.settings)
  return (
    asStillImage(profile.avatar) ||
    asStillImage(settings.profile_media_url) ||
    asStillImage(settings.profile_image) ||
    asStillImage(settings.profile_image_url)
  )
}

function profileAboutFeaturedStill(profile: ApiProfile): string {
  const settings = settingsRowsToMap(profile.settings)
  return (
    asStillImage(settings.about_me_featured_media_url) ||
    asStillImage(settings.featured_image) ||
    asStillImage(settings.featured_image_url)
  )
}

/**
 * Account menu avatar priority:
 * 1. Logged-in user account avatar
 * 2. First owned card profile / avatar still
 * 3. First owned card About Me featured still
 */
export function resolveAccountHeaderAvatarUrl(
  accountAvatar?: string | null,
  profiles?: ApiProfile[] | null
): string | null {
  const fromAccount = asStillImage(accountAvatar)
  if (fromAccount) return fromAccount

  if (!profiles?.length) return null

  for (const profile of profiles) {
    const avatar = profileAvatarStill(profile)
    if (avatar) return avatar
  }

  for (const profile of profiles) {
    const featured = profileAboutFeaturedStill(profile)
    if (featured) return featured
  }

  return null
}
