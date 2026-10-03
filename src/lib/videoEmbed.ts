/** Direct file / CDN video (not a host page like YouTube / Drive). */
export function isDirectVideoFileUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('blob:') || /^data:video\//i.test(trimmed)) return true
  if (/(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|drive\.google\.com|docs\.google\.com)/i.test(trimmed)) {
    return false
  }
  if (/\.(m4v|mov|mp4|ogv|webm|ogg)(\?|#|$)/i.test(trimmed)) return true
  if (/\/video\/upload\//i.test(trimmed)) return true
  return false
}

function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const fromQuery = parsed.searchParams.get('v')
      if (fromQuery) return fromQuery
      const parts = parsed.pathname.split('/').filter(Boolean)
      for (const key of ['embed', 'shorts', 'live', 'v']) {
        const idx = parts.indexOf(key)
        if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

function vimeoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, '')
    if (!host.endsWith('vimeo.com')) return null
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts[0] === 'video' && parts[1]) return parts[1]
    if (parts[0] && /^\d+$/.test(parts[0])) return parts[0]
  } catch {
    /* ignore */
  }
  return null
}

function dailymotionId(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, '')
    if (!host.includes('dailymotion.com') && host !== 'dai.ly') return null
    if (host === 'dai.ly') return parsed.pathname.split('/').filter(Boolean)[0] || null
    const parts = parsed.pathname.split('/').filter(Boolean)
    const videoIdx = parts.indexOf('video')
    if (videoIdx >= 0 && parts[videoIdx + 1]) return parts[videoIdx + 1].split('_')[0]
  } catch {
    /* ignore */
  }
  return null
}

function googleDriveFileId(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, '')
    if (host !== 'drive.google.com' && host !== 'docs.google.com') return null

    const parts = parsed.pathname.split('/').filter(Boolean)
    // /file/d/FILE_ID/view|preview|edit
    const fileIdx = parts.indexOf('file')
    if (fileIdx >= 0 && parts[fileIdx + 1] === 'd' && parts[fileIdx + 2]) {
      return parts[fileIdx + 2]
    }
    // /open?id=FILE_ID or /uc?id=FILE_ID
    const fromQuery = parsed.searchParams.get('id')
    if (fromQuery) return fromQuery
  } catch {
    /* ignore */
  }
  return null
}

/** Convert a watch/share URL into an autoplaying embed iframe src, or null. */
export function toVideoEmbedUrl(url: string, options?: { autoplay?: boolean }): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const autoplay = options?.autoplay !== false

  const yt = youtubeId(trimmed)
  if (yt) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
    })
    return `https://www.youtube-nocookie.com/embed/${yt}?${params.toString()}`
  }

  const vimeo = vimeoId(trimmed)
  if (vimeo) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      playsinline: '1',
    })
    return `https://player.vimeo.com/video/${vimeo}?${params.toString()}`
  }

  const daily = dailymotionId(trimmed)
  if (daily) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
    })
    return `https://www.dailymotion.com/embed/video/${daily}?${params.toString()}`
  }

  const driveId = googleDriveFileId(trimmed)
  if (driveId) {
    // Drive preview player — file must be shared as “Anyone with the link”.
    return `https://drive.google.com/file/d/${driveId}/preview`
  }

  return null
}

export type PlayableVideo = { kind: 'file'; src: string } | { kind: 'embed'; src: string; pageUrl?: string }

/** Prefer an inline file, then an embeddable link (YouTube/Vimeo/etc). */
export function resolvePlayableVideo(input: {
  featuredImage?: string | null
  videoUrl?: string | null
}): PlayableVideo | null {
  const featured = input.featuredImage?.trim() || ''
  const link = input.videoUrl?.trim() || ''

  if (featured && isDirectVideoFileUrl(featured)) return { kind: 'file', src: featured }
  if (link && isDirectVideoFileUrl(link)) return { kind: 'file', src: link }

  const embedFromLink = link ? toVideoEmbedUrl(link) : null
  if (embedFromLink) return { kind: 'embed', src: embedFromLink, pageUrl: link }

  const embedFromFeatured = featured ? toVideoEmbedUrl(featured) : null
  if (embedFromFeatured) return { kind: 'embed', src: embedFromFeatured, pageUrl: featured }

  return null
}
