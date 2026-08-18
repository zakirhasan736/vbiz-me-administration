import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { isVideoUrl } from '@/lib/mediaUrl'

function normalizeSafeVideoUrl(value: string): string {
  const candidate = value.trim().replace(/&amp;/gi, '&')
  if (!candidate) return ''
  if (candidate.startsWith('/') || candidate.startsWith('blob:')) return candidate

  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? candidate : ''
  } catch {
    return ''
  }
}

function extractLinkedUrl(description: string): string {
  const match = description.match(/href\s*=\s*["']([^"']+)["']/i)
  return match?.[1] ?? ''
}

function youtubeWatchUrlFromThumbnail(value: string): string {
  const safeUrl = normalizeSafeVideoUrl(value)
  if (!safeUrl || safeUrl.startsWith('/') || safeUrl.startsWith('blob:')) return ''

  try {
    const parsed = new URL(safeUrl)
    const host = parsed.hostname.toLowerCase()
    if (host !== 'img.youtube.com' && host !== 'i.ytimg.com' && !host.endsWith('.ytimg.com')) return ''

    const match = parsed.pathname.match(/\/vi(?:_webp)?\/([a-z0-9_-]{6,})(?:\/|$)/i)
    return match ? `https://www.youtube.com/watch?v=${match[1]}` : ''
  } catch {
    return ''
  }
}

export function resolveVideoLinkUrl(item: DynamicPostListItem): string {
  const directUrl = normalizeSafeVideoUrl(item.generalInfoUrl)
  if (directUrl) return directUrl

  const linkedUrl = normalizeSafeVideoUrl(extractLinkedUrl(item.description))
  if (linkedUrl) return linkedUrl

  const mediaUrls = [item.featuredImage, ...item.attachments.map((attachment) => attachment.url)]
  for (const mediaUrl of mediaUrls) {
    const safeUrl = normalizeSafeVideoUrl(mediaUrl)
    if (safeUrl && isVideoUrl(safeUrl)) return safeUrl
  }

  for (const mediaUrl of mediaUrls) {
    const youtubeUrl = youtubeWatchUrlFromThumbnail(mediaUrl)
    if (youtubeUrl) return youtubeUrl
  }

  return ''
}
