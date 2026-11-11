import { extractYoutubeVideoId } from '@/lib/youtubeEmbed'

/**
 * Intro-video "watch pages": /vCard/{slug}/video. Google only lists a video in video results
 * when it is the main content of its page, which a full card never is ("Video isn't on a
 * watch page" in Search Console). This page gives each intro video that home.
 */

export const PUBLIC_CARD_VIDEO_SEGMENT = 'video'

export type PublicCardIntroVideo =
  | { kind: 'file'; contentUrl: string }
  | { kind: 'youtube'; youtubeId: string; watchUrl: string; embedUrl: string; thumbnailUrl: string }

export function buildPublicCardVideoPath(cardPath: string): string {
  return `${cardPath.replace(/\/$/, '')}/${PUBLIC_CARD_VIDEO_SEGMENT}`
}

/** Drop media fragments like `#t=0.001` (a Safari first-frame hint), which aren't part of the file URL. */
export function stripMediaFragment(url: string): string {
  const hash = url.indexOf('#')
  return (hash >= 0 ? url.slice(0, hash) : url).trim()
}

/** Classify an intro URL as an uploaded file or a YouTube video; null if unusable. */
export function resolveIntroVideo(rawUrl: string | null | undefined): PublicCardIntroVideo | null {
  const url = stripMediaFragment(String(rawUrl || ''))
  if (!/^https?:\/\//i.test(url)) return null
  const youtubeId = extractYoutubeVideoId(url)
  if (youtubeId) {
    return {
      kind: 'youtube',
      youtubeId,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    }
  }
  return { kind: 'file', contentUrl: url }
}

const EARLIEST_UPLOAD_MS = Date.UTC(2020, 0, 1)

/**
 * Uploaded media files are named `{epochMillis}-{original name}` (e.g. `1786827601866-intro.mp4`).
 * That prefix is the upload time, which Google requires as `uploadDate`.
 */
export function uploadDateFromMediaUrl(url: string, now = Date.now()): string | null {
  const file = stripMediaFragment(url).split('?')[0].split('/').pop() || ''
  const match = /^(\d{13})[-_]/.exec(file)
  if (!match) return null
  const ms = Number(match[1])
  if (ms < EARLIEST_UPLOAD_MS || ms > now + 24 * 60 * 60 * 1000) return null
  return new Date(ms).toISOString()
}

export type PublicCardVideoSchemaInput = {
  video: PublicCardIntroVideo
  watchPageUrl: string
  cardUrl: string
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string | null
  personId?: string
}

export function buildPublicCardVideoTitle(name: string, companyLine: string): string {
  return companyLine ? `Meet ${name} – ${companyLine}` : `Meet ${name}`
}

/** VideoObject per Google's video structured data (name, description, thumbnailUrl, uploadDate required). */
export function buildPublicCardVideoObject(input: PublicCardVideoSchemaInput): Record<string, unknown> {
  const { video } = input
  return {
    '@type': 'VideoObject',
    '@id': `${input.watchPageUrl}#video`,
    name: input.name,
    description: input.description,
    thumbnailUrl: [input.thumbnailUrl],
    ...(input.uploadDate ? { uploadDate: input.uploadDate } : {}),
    ...(video.kind === 'file' ? { contentUrl: video.contentUrl } : { embedUrl: video.embedUrl }),
    url: input.watchPageUrl,
    inLanguage: 'en-US',
    ...(input.personId ? { about: { '@id': input.personId } } : {}),
    isPartOf: { '@id': `${input.watchPageUrl}#page` },
  }
}
