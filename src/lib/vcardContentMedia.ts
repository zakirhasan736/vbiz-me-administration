import { decodeHtmlText } from '@/lib/htmlText'
import type {
  VCardContentMedia,
  VCardContentMediaGalleryItem,
  VCardContentMediaVideoItem,
  VCardData,
} from '@/types/vcard'

export const CONTENT_MEDIA_SETTING_KEY = 'content_media_json'

export const DEFAULT_VCARD_CONTENT_MEDIA: VCardContentMedia = {
  gallery: [],
  videos: [],
  note: '',
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/** True when a URL can be saved to settings (rejects empty and ephemeral blob: URLs). */
export function isPersistableMediaUrl(url: string): boolean {
  const trimmed = url.trim()
  return Boolean(trimmed) && !trimmed.startsWith('blob:')
}

function normalizeGalleryItem(raw: unknown, index: number): VCardContentMediaGalleryItem | null {
  if (!raw || typeof raw !== 'object') {
    if (typeof raw === 'string' && raw.trim()) {
      return {
        id: `cm_img_${index}`,
        url: raw.trim(),
        name: 'Gallery image',
      }
    }
    return null
  }
  const item = raw as Record<string, unknown>
  const url = asString(item.url).trim()
  if (!url) return null
  const size = typeof item.size === 'number' && Number.isFinite(item.size) ? item.size : undefined
  const type = asString(item.type).trim() || undefined
  return {
    id: asString(item.id, `cm_img_${index}`),
    url,
    name: asString(item.name, 'Gallery image'),
    ...(type ? { type } : {}),
    ...(size != null ? { size } : {}),
  }
}

function normalizeVideoItem(raw: unknown, index: number): VCardContentMediaVideoItem | null {
  if (!raw || typeof raw !== 'object') {
    if (typeof raw === 'string' && raw.trim()) {
      return {
        id: `cm_vid_${index}`,
        title: 'Video',
        url: raw.trim(),
      }
    }
    return null
  }
  const item = raw as Record<string, unknown>
  const url = asString(item.url).trim()
  if (!url) return null
  return {
    id: asString(item.id, `cm_vid_${index}`),
    title: asString(item.title || item.name, 'Video'),
    url,
  }
}

/** Normalize editor / settings shapes into a stable Content & media block. */
export function normalizeVCardContentMedia(raw: unknown): VCardContentMedia {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_VCARD_CONTENT_MEDIA, gallery: [], videos: [] }
  }
  const block = raw as Record<string, unknown>
  const gallerySource = Array.isArray(block.gallery) ? block.gallery : Array.isArray(block.images) ? block.images : []
  const videosSource = Array.isArray(block.videos) ? block.videos : []

  return {
    gallery: gallerySource
      .map(normalizeGalleryItem)
      .filter((item): item is VCardContentMediaGalleryItem => Boolean(item)),
    videos: videosSource.map(normalizeVideoItem).filter((item): item is VCardContentMediaVideoItem => Boolean(item)),
    note: asString(block.note || block.caption),
  }
}

export function getVCardContentMedia(data: VCardData): VCardContentMedia {
  return normalizeVCardContentMedia(data.contentMedia)
}

export function parseContentMediaJson(raw?: string | null): VCardContentMedia {
  if (!raw?.trim()) return { ...DEFAULT_VCARD_CONTENT_MEDIA, gallery: [], videos: [] }
  try {
    return normalizeVCardContentMedia(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_VCARD_CONTENT_MEDIA, gallery: [], videos: [] }
  }
}

export function mapContentMediaToApiSettings(contentMedia?: VCardContentMedia | null): Record<string, string> {
  const normalized = normalizeVCardContentMedia(contentMedia)
  return {
    [CONTENT_MEDIA_SETTING_KEY]: JSON.stringify({
      gallery: normalized.gallery
        .filter((item) => isPersistableMediaUrl(item.url))
        .map((item) => ({
          id: item.id,
          url: item.url.trim(),
          name: item.name,
          ...(item.type ? { type: item.type } : {}),
          ...(typeof item.size === 'number' ? { size: item.size } : {}),
        })),
      videos: normalized.videos
        .filter((item) => isPersistableMediaUrl(item.url))
        .map((item) => ({
          id: item.id,
          title: decodeHtmlText(item.title) || 'Video',
          url: item.url.trim(),
        })),
      note: normalized.note,
    }),
  }
}

export function hasContentMediaContent(contentMedia?: VCardContentMedia | null): boolean {
  if (!contentMedia) return false
  return (
    Boolean(contentMedia.note?.trim()) ||
    contentMedia.gallery.some((item) => isPersistableMediaUrl(item.url)) ||
    contentMedia.videos.some((item) => isPersistableMediaUrl(item.url))
  )
}

/** True when a title looks like an uploaded filename rather than a user-authored label. */
export function isRawMediaFilenameTitle(title?: string | null): boolean {
  const trimmed = (title || '').trim()
  if (!trimmed) return true
  if (/^video$/i.test(trimmed)) return true
  if (/\.(mp4|m4v|mov|webm|avi|mkv|ogg|ogv)(\b|$)/i.test(trimmed)) return true
  if (/^whatsapp\s+(video|image)\b/i.test(trimmed)) return true
  if (/^img[-_]?\d+/i.test(trimmed)) return true
  return false
}

/**
 * Public/preview caption for a video — only intentional titles, never raw upload filenames.
 * Returns null when the caption row should be hidden.
 */
export function getContentMediaVideoDisplayTitle(title?: string | null): string | null {
  const trimmed = decodeHtmlText(title || '').trim()
  if (!trimmed || isRawMediaFilenameTitle(trimmed)) return null
  return trimmed
}
