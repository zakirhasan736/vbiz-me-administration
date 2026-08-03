import type { MyCardMediaBlock } from '@/interfaces/api/myCard'

export type ResolvedNotificationAvatar = {
  /** Static logo / profile image — preferred for the notification bubble */
  imageUrl: string
  /** Owner intro or profile video — used when no static image exists */
  videoUrl: string
  /** Best URL to send on the push payload */
  displayUrl: string
}

export function isVideoAvatarSrc(src: string) {
  const value = src.trim().toLowerCase()
  return value.endsWith('.mp4') || value.endsWith('.webm') || value.includes('/video')
}

function mediaBlockImageUrl(block?: MyCardMediaBlock): string {
  if (!block) return ''
  const candidates = [block.url, block.fallback_url]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && !isVideoAvatarSrc(value)) return value
  }
  return ''
}

function mediaBlockVideoUrl(block?: MyCardMediaBlock): string {
  if (!block) return ''
  const candidates = [block.regular_video?.url, block.url, block.fallback_url]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && isVideoAvatarSrc(value)) return value
  }
  return ''
}

function resolveCompanyLogoUrl(icon?: string): string {
  const value = icon?.trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
    return value
  }
  return ''
}

/** Business logo first, then card-owner profile image, then intro/profile video. */
export function resolveNotificationAvatar(blocks: {
  companyIcon?: string
  profileMedia?: MyCardMediaBlock
  introVideo?: MyCardMediaBlock
}): ResolvedNotificationAvatar {
  const companyLogo = resolveCompanyLogoUrl(blocks.companyIcon)
  const ownerImage = mediaBlockImageUrl(blocks.profileMedia)
  const ownerVideo = mediaBlockVideoUrl(blocks.profileMedia) || mediaBlockVideoUrl(blocks.introVideo)

  const imageUrl = companyLogo || ownerImage
  const videoUrl = imageUrl ? '' : ownerVideo
  const displayUrl = imageUrl || videoUrl

  return { imageUrl, videoUrl, displayUrl }
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'V'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}
