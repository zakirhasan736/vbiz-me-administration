import { isAudioUrl, isDocumentUrl, isImageUrl, isVideoUrl } from '@/lib/mediaUrl'
import { extractYoutubeVideoId } from '@/lib/youtubeEmbed'

/**
 * Helpers for media URLs a card owner pastes instead of uploading (their own CDN, Unsplash,
 * YouTube, Vimeo…). Shared by the editor uploaders and the public feature-media renderers so
 * a pasted link previews in the editor exactly the way it will render on the public card.
 */

export type PastedMediaKind = 'embed' | 'video' | 'image' | 'audio' | 'document' | 'unknown'

export type AllowedMediaKinds = {
  image: boolean
  video: boolean
  audio: boolean
  document: boolean
}

/** Trimmed absolute http(s) URL, or null when the text isn't a usable link. */
export function normalizePastedMediaUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Tolerate a pasted protocol-less link like "cdn.example.com/a.jpg".
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

function vimeoVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null
    const id = parsed.pathname.split('/').find((part) => /^\d{5,}$/.test(part))
    return id || null
  } catch {
    return null
  }
}

/** Player URL for YouTube / Vimeo links (these can't play in a <video> tag), else null. */
export function resolveEmbedVideoUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const youtubeId = extractYoutubeVideoId(trimmed)
  if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}`
  const vimeoId = vimeoVideoId(trimmed)
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`
  return null
}

/** True for a playable video file (not a YouTube/Vimeo page, which needs an embed). */
export function isDirectVideoUrl(url: string): boolean {
  return isVideoUrl(url) && !resolveEmbedVideoUrl(url)
}

export function classifyPastedMediaUrl(url: string): PastedMediaKind {
  if (resolveEmbedVideoUrl(url)) return 'embed'
  if (isDirectVideoUrl(url)) return 'video'
  if (isImageUrl(url)) return 'image'
  if (isAudioUrl(url)) return 'audio'
  if (isDocumentUrl(url)) return 'document'
  return 'unknown'
}

/** Which kinds a file input `accept` string allows (empty accept = everything). */
export function allowedKindsFromAccept(accept: string | undefined | null): AllowedMediaKinds {
  const tokens = String(accept || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (tokens.length === 0 || tokens.includes('*/*')) {
    return { image: true, video: true, audio: true, document: true }
  }
  const has = (prefix: string, exts: RegExp) =>
    tokens.some((t) => t === `${prefix}/*` || t.startsWith(`${prefix}/`) || exts.test(t))
  return {
    image: has('image', /^\.(png|jpe?g|gif|webp|avif|svg|bmp)$/),
    video: has('video', /^\.(mp4|webm|mov|m4v|ogv)$/),
    audio: has('audio', /^\.(mp3|wav|m4a|aac|flac)$/),
    document: tokens.some(
      (t) => t === 'application/pdf' || t.startsWith('application/') || /^\.(pdf|docx?|pptx?|xlsx?|txt|rtf|zip)$/.test(t)
    ),
  }
}

/**
 * Error message for a pasted URL that this field can't use, or null when it's fine.
 * An unrecognized link (no extension, unknown host) is allowed wherever images are, since
 * most pasted links without an extension are images served by a CDN.
 */
export function validatePastedMediaUrl(url: string, allowed: AllowedMediaKinds): string | null {
  const kind = classifyPastedMediaUrl(url)
  const accepts: Record<PastedMediaKind, boolean> = {
    embed: allowed.video,
    video: allowed.video,
    image: allowed.image,
    audio: allowed.audio,
    document: allowed.document,
    unknown: allowed.image || allowed.document,
  }
  if (accepts[kind]) return null
  const wanted = [
    allowed.image ? 'an image' : '',
    allowed.video ? 'a video' : '',
    allowed.audio ? 'an audio file' : '',
    allowed.document ? 'a document' : '',
  ].filter(Boolean)
  return `This field needs ${wanted.join(' or ') || 'a different file type'} URL.`
}
