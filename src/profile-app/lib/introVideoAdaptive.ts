export type IntroQuality = 360 | 540 | 720

export type NetworkHints = {
  downlink?: number
  effectiveType?: string
  saveData?: boolean
  rtt?: number
}

export const INTRO_QUALITY_LADDER: IntroQuality[] = [360, 540, 720]

type NavigatorConnection = {
  downlink?: number
  effectiveType?: string
  saveData?: boolean
  rtt?: number
}

export function readNetworkHints(
  nav: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator
): NetworkHints {
  const conn =
    (nav as (Navigator & { connection?: NavigatorConnection; mozConnection?: NavigatorConnection }) | undefined)
      ?.connection || (nav as (Navigator & { mozConnection?: NavigatorConnection }) | undefined)?.mozConnection
  if (!conn) return {}
  return {
    downlink: typeof conn.downlink === 'number' ? conn.downlink : undefined,
    effectiveType: conn.effectiveType,
    saveData: Boolean(conn.saveData),
    rtt: typeof conn.rtt === 'number' ? conn.rtt : undefined,
  }
}

export function pickIntroQuality(
  hints: NetworkHints,
  options?: { isMobile?: boolean; isSafari?: boolean }
): IntroQuality {
  if (hints.saveData) return 360

  const type = (hints.effectiveType || '').toLowerCase()
  if (type === 'slow-2g' || type === '2g') return 360
  if (type === '3g') return options?.isSafari ? 360 : 540

  if (typeof hints.downlink === 'number' && hints.downlink > 0) {
    if (hints.downlink < 1.5) return 360
    if (hints.downlink < 4) return options?.isSafari ? 360 : 540
    return options?.isSafari && options?.isMobile ? 540 : 720
  }

  if (typeof hints.rtt === 'number' && hints.rtt > 300) return 360

  // Safari / iOS have no Network Information API and buffer more cautiously.
  // Start smaller so the first playable frame arrives sooner on weak links.
  if (options?.isSafari) {
    return options.isMobile ? 360 : 540
  }

  if (options?.isMobile) return 540
  return 720
}

/**
 * Background/cover loops are decorative — prefer the smallest playable stream so
 * home appears ready immediately after intro (never wait on 720p).
 * iPhone / Safari always stay at 360 — they buffer cautiously and lack a reliable
 * Network Information API.
 */
export function pickBackgroundQuality(
  hints: NetworkHints,
  options?: { isMobile?: boolean; isSafari?: boolean }
): IntroQuality {
  if (hints.saveData) return 360
  // Decorative bg: iOS/Safari never climb above 360p.
  if (options?.isSafari || options?.isMobile) return 360

  const type = (hints.effectiveType || '').toLowerCase()
  if (type === 'slow-2g' || type === '2g' || type === '3g') return 360

  if (typeof hints.downlink === 'number' && hints.downlink > 0) {
    if (hints.downlink < 3) return 360
    return 540
  }

  if (typeof hints.rtt === 'number' && hints.rtt > 250) return 360

  return 540
}

export function lowerIntroQuality(quality: IntroQuality): IntroQuality | null {
  const index = INTRO_QUALITY_LADDER.indexOf(quality)
  if (index <= 0) return null
  return INTRO_QUALITY_LADDER[index - 1] ?? null
}

type AdaptiveVideoOptions = {
  /** Strip audio track — ideal for muted looping background/cover videos. */
  stripAudio?: boolean
  /**
   * Ultra-light encode for iPhone Safari background loops: lower bitrate + fps
   * so the first playable frame arrives with far fewer bytes.
   */
  lean?: boolean
}

function transformForQuality(quality: IntroQuality, options?: AdaptiveVideoOptions): string {
  const audio = options?.stripAudio ? ',ac_none' : ''
  if (options?.lean) {
    // Cap at 360 + 20fps — enough for a looping wallpaper, cheap to decode on iOS.
    const w = Math.min(quality, 360)
    return `f_mp4,vc_h264,q_auto:low,w_${w},c_limit,br_180k,fps_20${audio}`
  }
  // Leaner ladders: Safari and slow networks benefit from smaller first chunks.
  const bitrate = quality <= 360 ? 'br_280k' : quality <= 540 ? 'br_550k' : 'br_900k'
  const q = quality <= 540 ? 'q_auto:eco' : 'q_auto:good'
  return `f_mp4,vc_h264,${q},w_${quality},c_limit,${bitrate}${audio}`
}

function publicIdFromCloudinaryRest(rest: string): string {
  const versionAtStart = /^v\d+\//.test(rest)
  if (versionAtStart) return rest

  const versionIndex = rest.search(/\/v\d+\//)
  if (versionIndex >= 0) return rest.slice(versionIndex + 1)

  const slash = rest.indexOf('/')
  if (slash === -1) return rest

  const first = rest.slice(0, slash)
  if (/[,]|^(?:[a-z]{1,3}_)/i.test(first)) return rest.slice(slash + 1)
  return rest
}

export function applyCloudinaryVideoQuality(
  url: string,
  quality: IntroQuality,
  options?: AdaptiveVideoOptions
): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const match = parsed.pathname.match(/^(\/[^/]+\/video\/(?:upload|fetch)\/)(.*)$/i)
  if (!match) return null

  const prefix = match[1]
  const rest = match[2] || ''
  if (!rest) return null

  parsed.pathname = `${prefix}${transformForQuality(quality, options)}/${publicIdFromCloudinaryRest(rest)}`
  return parsed.toString()
}

export function applyImageKitVideoQuality(
  url: string,
  quality: IntroQuality,
  options?: AdaptiveVideoOptions
): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (!/imagekit\.io$/i.test(parsed.hostname) && !parsed.hostname.toLowerCase().includes('imagekit')) {
    return null
  }

  const width = options?.lean ? Math.min(quality, 360) : quality
  const q = options?.lean ? 30 : quality <= 360 ? 40 : quality <= 540 ? 50 : 60
  const parts = [`w-${width}`, `q-${q}`, 'f-mp4']
  if (options?.lean) parts.push('fps-20')
  if (options?.stripAudio) parts.push('ac-none')
  parsed.searchParams.set('tr', parts.join(','))
  return parsed.toString()
}

export function buildAdaptiveIntroUrl(
  originalUrl: string,
  quality: IntroQuality,
  options?: AdaptiveVideoOptions
): string {
  const trimmed = originalUrl.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('/') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }

  return (
    applyCloudinaryVideoQuality(trimmed, quality, options) ||
    applyImageKitVideoQuality(trimmed, quality, options) ||
    trimmed
  )
}

/** Background / cover loops never need audio — strip it to cut bytes on Safari. */
export function buildAdaptiveBackgroundVideoUrl(
  originalUrl: string,
  quality: IntroQuality,
  options?: { lean?: boolean }
): string {
  return buildAdaptiveIntroUrl(originalUrl, quality, {
    stripAudio: true,
    lean: options?.lean,
  })
}

/**
 * Lightweight still from the first video frame — paints instantly on Safari while
 * the muted loop buffers underneath.
 */
export function buildBackgroundVideoPosterUrl(originalUrl: string): string | null {
  const trimmed = originalUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  const match = parsed.pathname.match(/^(\/[^/]+\/video\/(?:upload|fetch)\/)(.*)$/i)
  if (!match) return null
  const rest = match[2] || ''
  if (!rest) return null

  parsed.pathname = `${match[1]}so_0,f_jpg,w_360,c_limit,q_auto:eco/${publicIdFromCloudinaryRest(rest)}`
  return parsed.toString()
}

/** Resolve the exact URL the home background player should fetch (network-aware). */
export function resolveAdaptiveBackgroundVideoSrc(
  originalUrl: string,
  options?: { isMobile?: boolean; isSafari?: boolean; hints?: NetworkHints }
): string {
  const trimmed = originalUrl.trim()
  if (!trimmed) return ''
  const quality = pickBackgroundQuality(options?.hints ?? readNetworkHints(), {
    isMobile: options?.isMobile,
    isSafari: options?.isSafari,
  })
  const lean = Boolean(options?.isSafari || options?.isMobile)
  return withVideoStartHint(buildAdaptiveBackgroundVideoUrl(trimmed, quality, { lean }))
}

export function canAdaptIntroUrl(url: string): boolean {
  return buildAdaptiveIntroUrl(url, 360) !== url.trim()
}

/**
 * Media fragment forces Safari/iOS to decode an early frame instead of waiting
 * for a larger buffer before painting.
 */
export function withVideoStartHint(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || trimmed.startsWith('/')) return trimmed
  if (/#t=/i.test(trimmed)) return trimmed
  return `${trimmed}#t=0.001`
}
