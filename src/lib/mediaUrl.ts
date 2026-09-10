export type PortfolioMediaType = 'Image' | 'Video' | 'Audio' | 'Document' | 'Link'

export type GalleryMediaKind = 'image' | 'video' | 'audio' | 'document' | 'link'

/** True when the URL points at video media (not a still image). */
export function isVideoUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('blob:') || /^data:video\//i.test(trimmed)) return true
  if (/\.(m4v|mov|mp4|ogv|webm|ogg)(\?|#|$)/i.test(trimmed)) return true
  if (/\/video\/upload\//i.test(trimmed)) return true
  if (/(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(trimmed)) return true
  return false
}

/** True when the URL points at audio media. */
export function isAudioUrl(url: string, fileName?: string | null): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (/^data:audio\//i.test(trimmed)) return true
  const name = (fileName || trimmed.split('?')[0] || '').toLowerCase()
  return /\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i.test(name) || /\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i.test(trimmed)
}

/** True when the URL points at a document (pdf/doc/docx/txt/rtf). */
export function isDocumentUrl(url: string, fileName?: string | null): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (/^data:application\/(pdf|msword|vnd\.)/i.test(trimmed) || /^data:text\/plain/i.test(trimmed)) return true
  const name = (fileName || trimmed.split('?')[0] || '').toLowerCase()
  return /\.(pdf|docx?|rtf|txt)(\?|#|$)/i.test(name) || /\.(pdf|docx?|rtf|txt)(\?|#|$)/i.test(trimmed)
}

/** Map portfolio admin type / URL heuristics to gallery render kind. */
export function portfolioTypeToMediaKind(type: string | undefined | null): GalleryMediaKind | null {
  switch ((type || '').trim().toLowerCase()) {
    case 'image':
      return 'image'
    case 'video':
      return 'video'
    case 'audio':
      return 'audio'
    case 'document':
      return 'document'
    case 'link':
      return 'link'
    default:
      return null
  }
}

/**
 * Detect portfolio type from uploaded media URL / MIME / filename.
 * YouTube/Vimeo hosts map to Video; bare http links without media cues map to Link.
 */
export function detectPortfolioType(
  url: string,
  mimeType?: string | null,
  fileName?: string | null
): PortfolioMediaType {
  const trimmed = url.trim()
  const mime = (mimeType || '').toLowerCase()
  const name = (fileName || trimmed.split('?')[0] || '').toLowerCase()
  const haystack = `${trimmed} ${name}`.toLowerCase()

  if (
    mime.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i.test(haystack) ||
    /\/video\/upload\//i.test(trimmed) ||
    /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(trimmed)
  ) {
    return 'Video'
  }
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i.test(haystack)) {
    return 'Audio'
  }
  if (
    mime === 'application/pdf' ||
    mime === 'text/plain' ||
    mime.includes('msword') ||
    mime.includes('officedocument') ||
    /\.(pdf|docx?|rtf|txt)(\?|#|$)/i.test(haystack)
  ) {
    return 'Document'
  }
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|#|$)/i.test(name)) {
    return 'Image'
  }
  if (isVideoUrl(trimmed)) return 'Video'
  if (isAudioUrl(trimmed, fileName)) return 'Audio'
  if (isDocumentUrl(trimmed, fileName)) return 'Document'
  if (/^https?:\/\//i.test(trimmed)) return 'Link'
  return 'Image'
}

/** Infer gallery media kind from URL (and optional explicit portfolio type). */
export function detectGalleryMediaKind(
  url: string,
  options?: { type?: string | null; mimeType?: string | null; fileName?: string | null; linkUrl?: string | null }
): GalleryMediaKind {
  const mediaUrl = url.trim() || (options?.linkUrl || '').trim()
  if (!mediaUrl) {
    return portfolioTypeToMediaKind(options?.type) || 'image'
  }

  // URL/MIME signals win when they clearly identify non-image media.
  const fromSignals = detectPortfolioType(mediaUrl, options?.mimeType, options?.fileName)
  if (fromSignals === 'Video') return 'video'
  if (fromSignals === 'Audio') return 'audio'
  if (fromSignals === 'Document') return 'document'

  const fromType = portfolioTypeToMediaKind(options?.type)
  if (fromType && fromType !== 'image') return fromType
  if (fromSignals === 'Link') return 'link'
  if (fromType) return fromType
  return 'image'
}

/** next/image requires absolute http(s), root-relative /, blob:, or data: URLs. */
export function isUsableImageSrc(url?: string | null): boolean {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return false
  return (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  )
}

/** Encode remote media URLs so filenames with spaces play reliably in HTML video elements. */
export function encodeMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }

  // Bare filenames like "1782843162_arif.jpg" are not valid next/image src values
  if (!isUsableImageSrc(trimmed)) {
    return ''
  }

  try {
    const parsed = new URL(trimmed, trimmed.startsWith('/') ? 'http://local.invalid' : undefined)
    if (trimmed.startsWith('/')) {
      return trimmed
        .split('/')
        .map((segment, i) => {
          if (i === 0 || !segment) return segment
          try {
            return encodeURIComponent(decodeURIComponent(segment))
          } catch {
            return encodeURIComponent(segment)
          }
        })
        .join('/')
    }
    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment) => {
        if (!segment) return segment
        try {
          return encodeURIComponent(decodeURIComponent(segment))
        } catch {
          return encodeURIComponent(segment)
        }
      })
      .join('/')

    return parsed.toString()
  } catch {
    return ''
  }
}
