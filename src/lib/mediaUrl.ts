/** True when the URL points at video media (not a still image). */
export function isVideoUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(trimmed) || trimmed.startsWith('blob:')
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
