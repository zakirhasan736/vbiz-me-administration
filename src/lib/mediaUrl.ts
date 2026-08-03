/** True when the URL points at video media (not a still image). */
export function isVideoUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(trimmed) || trimmed.startsWith('blob:')
}

/** Encode remote media URLs so filenames with spaces play reliably in HTML video elements. */
export function encodeMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
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
    return trimmed
  }
}
