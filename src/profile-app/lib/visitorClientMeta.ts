/**
 * Client-side visitor metadata for Save Contact / guest save.
 * Device/browser from UA + Client Hints; location approx from timezone (no GPS).
 */

function parseBrowser(ua: string): string {
  if (/Edg(?:e|A|iOS)?\//i.test(ua) || /EdgiOS\//i.test(ua)) return 'Microsoft Edge'
  if (/CriOS\//i.test(ua)) return 'Chrome'
  if (/FxiOS\//i.test(ua)) return 'Firefox'
  if (/OPiOS\//i.test(ua) || /OPR\//i.test(ua)) return 'Opera'
  if (/SamsungBrowser\//i.test(ua)) return 'Samsung Internet'
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/CriOS\//i.test(ua)) return 'Safari'
  return 'Unknown browser'
}

function parseDevice(ua: string): string {
  if (/iPhone/i.test(ua)) {
    const ios = ua.match(/OS (\d+)[._](\d+)/i)
    return ios ? `iPhone · iOS ${ios[1]}.${ios[2]}` : 'iPhone'
  }
  if (/iPad/i.test(ua)) {
    const ios = ua.match(/OS (\d+)[._](\d+)/i)
    return ios ? `iPad · iOS ${ios[1]}.${ios[2]}` : 'iPad'
  }
  if (/iPod/i.test(ua)) return 'iPod'
  if (/Android/i.test(ua)) {
    const ver = ua.match(/Android (\d+(?:\.\d+)?)/i)
    const model = ua.match(/;\s*([^;)]+)\s*Build\//i)
    const kind = /Mobile/i.test(ua) ? 'Android phone' : 'Android tablet'
    const parts = [kind]
    if (ver) parts.push(`Android ${ver[1]}`)
    if (model?.[1] && !/wv|Linux/i.test(model[1])) parts.push(model[1].trim())
    return parts.join(' · ')
  }
  if (/Windows Phone/i.test(ua)) return 'Windows Phone'
  if (/Windows NT/i.test(ua)) return 'Windows PC'
  if (/Macintosh|Mac OS X/i.test(ua)) {
    // iPadOS desktop UA looks like Mac — touch points help
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) return 'iPad'
    return 'Mac'
  }
  if (/CrOS/i.test(ua)) return 'Chromebook'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Unknown device'
}

/** Map IANA timezone → readable city/region label (approx, not GPS). */
function locationFromTimezone(timezone: string, language?: string): string {
  const tz = timezone.trim()
  if (!tz) return language ? `Locale ${language}` : 'Unknown'

  const known: Record<string, string> = {
    'Asia/Dhaka': 'Dhaka, Bangladesh',
    'Asia/Kolkata': 'India',
    'Asia/Calcutta': 'India',
    'Asia/Karachi': 'Pakistan',
    'Asia/Dubai': 'Dubai, UAE',
    'Asia/Riyadh': 'Saudi Arabia',
    'Asia/Singapore': 'Singapore',
    'Asia/Kuala_Lumpur': 'Malaysia',
    'Asia/Jakarta': 'Jakarta, Indonesia',
    'Asia/Bangkok': 'Bangkok, Thailand',
    'Asia/Shanghai': 'China',
    'Asia/Hong_Kong': 'Hong Kong',
    'Asia/Tokyo': 'Tokyo, Japan',
    'Asia/Seoul': 'Seoul, South Korea',
    'Asia/Manila': 'Philippines',
    'Europe/London': 'London, UK',
    'Europe/Paris': 'Paris, France',
    'Europe/Berlin': 'Berlin, Germany',
    'Europe/Amsterdam': 'Netherlands',
    'Europe/Madrid': 'Madrid, Spain',
    'Europe/Rome': 'Rome, Italy',
    'America/New_York': 'Eastern USA',
    'America/Chicago': 'Central USA',
    'America/Denver': 'Mountain USA',
    'America/Los_Angeles': 'Western USA',
    'America/Toronto': 'Toronto, Canada',
    'America/Vancouver': 'Vancouver, Canada',
    'America/Sao_Paulo': 'São Paulo, Brazil',
    'Australia/Sydney': 'Sydney, Australia',
    'Australia/Melbourne': 'Melbourne, Australia',
    'Pacific/Auckland': 'Auckland, New Zealand',
    UTC: 'UTC',
  }

  if (known[tz]) return `${known[tz]} (${tz})`

  // Asia/Dhaka → Dhaka
  const city = tz.includes('/') ? tz.split('/').pop()!.replace(/_/g, ' ') : tz
  return `${city} (${tz})`
}

export type VisitorClientMeta = {
  guestId: string | null
  userAgent: string | null
  language: string | null
  platform: string | null
  browser: string | null
  device: string | null
  screen: string | null
  timezone: string | null
  approximateLocation: string | null
  referrer: string | null
  cardSlug: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

export function collectVisitorClientMeta(options?: { guestId?: string | null; cardSlug?: string }): VisitorClientMeta {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      guestId: options?.guestId ?? null,
      userAgent: null,
      language: null,
      platform: null,
      browser: null,
      device: null,
      screen: null,
      timezone: null,
      approximateLocation: null,
      referrer: null,
      cardSlug: options?.cardSlug?.trim() || null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    }
  }

  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string; mobile?: boolean; brands?: Array<{ brand: string; version: string }> }
  }
  const ua = nav.userAgent || ''
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  const language = nav.language || ''
  const platform = nav.userAgentData?.platform || nav.platform || ''
  const params = new URLSearchParams(window.location.search)

  let referrer = document.referrer || ''
  if (!referrer) {
    const utm = params.get('utm_source') || params.get('ref') || params.get('source')
    if (utm) referrer = `Campaign / ${utm}`
    else referrer = 'Direct / QR'
  }

  return {
    guestId: options?.guestId ?? null,
    userAgent: ua || null,
    language: language || null,
    platform: platform || null,
    browser: parseBrowser(ua),
    device: parseDevice(ua),
    screen:
      typeof window.screen?.width === 'number' && typeof window.screen?.height === 'number'
        ? `${window.screen.width}x${window.screen.height}`
        : null,
    timezone: timezone || null,
    approximateLocation: locationFromTimezone(timezone, language),
    referrer,
    cardSlug: options?.cardSlug?.trim() || null,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  }
}
