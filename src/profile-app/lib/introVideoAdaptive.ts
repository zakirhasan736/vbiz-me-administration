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

export function pickIntroQuality(hints: NetworkHints, options?: { isMobile?: boolean }): IntroQuality {
  if (hints.saveData) return 360

  const type = (hints.effectiveType || '').toLowerCase()
  if (type === 'slow-2g' || type === '2g') return 360
  if (type === '3g') return 540

  if (typeof hints.downlink === 'number' && hints.downlink > 0) {
    if (hints.downlink < 1.5) return 360
    if (hints.downlink < 4) return 540
    return 720
  }

  if (typeof hints.rtt === 'number' && hints.rtt > 400) return 360

  // Safari / iOS have no Network Information API. Start at 540p on phones so
  // the first frame arrives before a full HD download, 720p on desktop.
  if (options?.isMobile) return 540
  return 720
}

export function lowerIntroQuality(quality: IntroQuality): IntroQuality | null {
  const index = INTRO_QUALITY_LADDER.indexOf(quality)
  if (index <= 0) return null
  return INTRO_QUALITY_LADDER[index - 1] ?? null
}

function transformForQuality(quality: IntroQuality): string {
  const bitrate = quality <= 360 ? 'br_400k' : quality <= 540 ? 'br_700k' : 'br_1200k'
  const q = quality <= 360 ? 'q_auto:eco' : 'q_auto:good'
  return `f_mp4,vc_h264,${q},w_${quality},c_limit,${bitrate}`
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

export function applyCloudinaryVideoQuality(url: string, quality: IntroQuality): string | null {
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

  parsed.pathname = `${prefix}${transformForQuality(quality)}/${publicIdFromCloudinaryRest(rest)}`
  return parsed.toString()
}

export function applyImageKitVideoQuality(url: string, quality: IntroQuality): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (!/imagekit\.io$/i.test(parsed.hostname) && !parsed.hostname.toLowerCase().includes('imagekit')) {
    return null
  }

  parsed.searchParams.set('tr', `w-${quality},q-60,f-mp4`)
  return parsed.toString()
}

export function buildAdaptiveIntroUrl(originalUrl: string, quality: IntroQuality): string {
  const trimmed = originalUrl.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('/') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }

  return applyCloudinaryVideoQuality(trimmed, quality) || applyImageKitVideoQuality(trimmed, quality) || trimmed
}

export function canAdaptIntroUrl(url: string): boolean {
  return buildAdaptiveIntroUrl(url, 360) !== url.trim()
}
