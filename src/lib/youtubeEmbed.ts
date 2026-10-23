/** Shared YouTube URL helpers for inline embeds (intro, explainer, background audio). */

export function extractYoutubeVideoId(url?: string | null): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id || null
    }
    if (host.endsWith('youtube.com')) {
      const fromQuery = parsed.searchParams.get('v')
      if (fromQuery) return fromQuery
      const parts = parsed.pathname.split('/').filter(Boolean)
      const embedIndex = parts.indexOf('embed')
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1]
      const shortsIndex = parts.indexOf('shorts')
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1]
    }
  } catch {
    /* not a URL */
  }

  return null
}

export function isYoutubeUrl(url?: string | null): boolean {
  return Boolean(extractYoutubeVideoId(url))
}

type EmbedOptions = {
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  loop?: boolean
  startSeconds?: number
  endSeconds?: number | null
  origin?: string
  /** enablejsapi for postMessage play/mute/ended */
  enableJsApi?: boolean
}

/** Visible inline player (intro / explainer). */
export function buildYoutubePlayerEmbedUrl(videoIdOrUrl: string, options: EmbedOptions = {}): string | null {
  const videoId =
    extractYoutubeVideoId(videoIdOrUrl) || (/^[\w-]{6,}$/.test(videoIdOrUrl.trim()) ? videoIdOrUrl.trim() : null)
  if (!videoId) return null

  const params = new URLSearchParams({
    autoplay: options.autoplay === false ? '0' : '1',
    mute: options.muted === false ? '0' : '1',
    controls: options.controls === false ? '0' : '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    fs: '1',
  })

  if (options.enableJsApi !== false) params.set('enablejsapi', '1')
  if (options.startSeconds && options.startSeconds > 0) {
    params.set('start', String(Math.floor(options.startSeconds)))
  }
  if (options.endSeconds != null && options.endSeconds > 0) {
    params.set('end', String(Math.floor(options.endSeconds)))
  }
  if (options.loop) {
    params.set('loop', '1')
    params.set('playlist', videoId)
  }
  if (options.origin) params.set('origin', options.origin)

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
