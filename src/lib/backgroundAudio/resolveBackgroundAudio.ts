import type { MyCardBackgroundAudio } from '@interfaces/api/myCard'

export type BackgroundAudioSource =
  | {
      type: 'file'
      src: string
      startTime: number
      endTime: number | null
      loop: boolean
    }
  | {
      type: 'youtube'
      videoId: string
      startTime: number
      endTime: number | null
      loop: boolean
    }

function parseTimeToSeconds(value?: string | number | null): number {
  if (value == null) return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : 0
  }
  if (typeof value !== 'string') return 0

  const trimmed = value.trim()
  if (!trimmed) return 0
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((part) => Number(part))
    if (parts.some((part) => !Number.isFinite(part))) return 0
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    return parts[0] ?? 0
  }
  const seconds = Number(trimmed)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 0
}

function extractYoutubeVideoId(url?: string | null): string | null {
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

export function isBackgroundAudioAvailable(audio?: MyCardBackgroundAudio | null): boolean {
  return resolveBackgroundAudioSource(audio) !== null
}

export function resolveBackgroundAudioSource(audio?: MyCardBackgroundAudio | null): BackgroundAudioSource | null {
  if (!audio || audio.enabled === false) return null

  const startTime = parseTimeToSeconds(audio.start_time)
  const endTimeRaw = parseTimeToSeconds(audio.end_time)
  const hasEndTime = audio.end_time != null && String(audio.end_time).trim() !== '' && Number.isFinite(endTimeRaw)
  const endTime = hasEndTime && endTimeRaw > startTime ? endTimeRaw : null
  const loop = audio.repeat !== false

  if (audio.use_youtube_link) {
    const videoId =
      audio.youtube?.video_id?.trim() ||
      extractYoutubeVideoId(audio.youtube?.link) ||
      extractYoutubeVideoId(audio.youtube?.embed_url)
    if (!videoId) return null
    return { type: 'youtube', videoId, startTime, endTime, loop }
  }

  const src = audio.url?.trim()
  if (!src) return null
  return { type: 'file', src, startTime, endTime, loop }
}

export function buildYoutubeEmbedUrl(
  source: Extract<BackgroundAudioSource, { type: 'youtube' }>,
  options?: { muted?: boolean; origin?: string }
): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: options?.muted === false ? '0' : '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    enablejsapi: '1',
  })

  if (source.startTime > 0) params.set('start', String(Math.floor(source.startTime)))
  if (source.endTime != null) params.set('end', String(Math.floor(source.endTime)))
  if (source.loop) {
    params.set('loop', '1')
    params.set('playlist', source.videoId)
  }
  if (options?.origin) params.set('origin', options.origin)

  return `https://www.youtube.com/embed/${source.videoId}?${params.toString()}`
}
