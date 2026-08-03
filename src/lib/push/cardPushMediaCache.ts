/**
 * Persist each card owner's logo / avatar so push notifications can show the
 * correct image even when the backend payload omits media fields.
 *
 * Written from the profile page (Cache API + localStorage).
 * Read by the service worker (Cache API) and the in-app toast (localStorage).
 */

export const CARD_PUSH_MEDIA_CACHE = 'vbiz-card-push-media-v1'
export const CARD_PUSH_MEDIA_STORAGE_PREFIX = 'vbiz_push_media_'
export const CARD_PUSH_MEDIA_LAST_KEY = '__last__'

export type CardPushMedia = {
  slug: string
  businessName: string
  /** Preferred static image (company logo or profile photo) */
  avatarImageUrl: string
  /** Fallback static / generic avatar URL */
  avatarUrl: string
  /** Profile / intro video when no static image exists */
  avatarVideoUrl: string
  /** Best absolute or same-origin URL for OS notification icon */
  icon: string
  updatedAt: string
}

export function cardPushMediaCachePath(slug: string) {
  return `/__vbiz_push_media__/${encodeURIComponent(slug.trim().toLowerCase())}`
}

function storageKey(slug: string) {
  return `${CARD_PUSH_MEDIA_STORAGE_PREFIX}${slug.trim().toLowerCase()}`
}

function absoluteCacheUrl(slug: string) {
  if (typeof window === 'undefined') return cardPushMediaCachePath(slug)
  return new URL(cardPushMediaCachePath(slug), window.location.origin).href
}

function isUsableStaticIcon(url: string) {
  const value = url.trim().toLowerCase()
  if (!value) return false
  if (value.includes('next.svg') || value.includes('vercel.svg')) return false
  if (value.endsWith('.mp4') || value.endsWith('.webm') || value.includes('/video')) return false
  return true
}

function normalizeMedia(input: Omit<CardPushMedia, 'updatedAt'> & { updatedAt?: string }): CardPushMedia | null {
  const slug = input.slug?.trim()
  if (!slug) return null

  const avatarImageUrl = input.avatarImageUrl?.trim() || ''
  const avatarUrl = input.avatarUrl?.trim() || ''
  const avatarVideoUrl = input.avatarVideoUrl?.trim() || ''
  const iconCandidate = (input.icon || avatarImageUrl || avatarUrl).trim()
  const icon = isUsableStaticIcon(iconCandidate)
    ? iconCandidate
    : isUsableStaticIcon(avatarImageUrl)
      ? avatarImageUrl
      : ''

  if (!icon && !avatarVideoUrl) return null

  return {
    slug: slug.toLowerCase(),
    businessName: input.businessName?.trim() || slug,
    avatarImageUrl: isUsableStaticIcon(avatarImageUrl) ? avatarImageUrl : icon,
    avatarUrl: isUsableStaticIcon(avatarUrl) ? avatarUrl : icon,
    avatarVideoUrl,
    icon,
    updatedAt: input.updatedAt || new Date().toISOString(),
  }
}

export function readCardPushMediaSync(slug?: string | null): CardPushMedia | null {
  if (typeof window === 'undefined') return null

  const tryRead = (key: string) => {
    try {
      const raw = localStorage.getItem(storageKey(key))
      if (!raw) return null
      return normalizeMedia(JSON.parse(raw) as CardPushMedia)
    } catch {
      return null
    }
  }

  if (slug?.trim()) {
    const exact = tryRead(slug)
    if (exact?.icon) return exact
  }

  return tryRead(CARD_PUSH_MEDIA_LAST_KEY)
}

export async function writeCardPushMedia(input: Omit<CardPushMedia, 'updatedAt'>): Promise<CardPushMedia | null> {
  const media = normalizeMedia(input)
  if (!media || typeof window === 'undefined') return null

  const persistLocal = (key: string) => {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(media))
    } catch {
      /* ignore quota / private mode */
    }
  }

  persistLocal(media.slug)
  persistLocal(CARD_PUSH_MEDIA_LAST_KEY)

  if ('caches' in window) {
    try {
      const cache = await caches.open(CARD_PUSH_MEDIA_CACHE)
      const body = new Response(JSON.stringify(media), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      })
      await cache.put(absoluteCacheUrl(media.slug), body.clone())
      await cache.put(absoluteCacheUrl(CARD_PUSH_MEDIA_LAST_KEY), body)
    } catch {
      /* ignore Cache API failures */
    }
  }

  return media
}

/** Merge cached card media into a push / toast payload when avatar fields are missing. */
export function enrichPushPayloadWithCardMedia<T extends Record<string, unknown>>(payload: T, slug?: string | null): T {
  const resolvedSlug =
    (typeof slug === 'string' && slug.trim()) || (typeof payload.slug === 'string' && payload.slug.trim()) || ''

  const cached = readCardPushMediaSync(resolvedSlug || null)
  if (!cached) return payload

  const existingImage =
    (typeof payload.avatarImageUrl === 'string' && payload.avatarImageUrl.trim()) ||
    (typeof payload.avatarUrl === 'string' && payload.avatarUrl.trim()) ||
    ''

  if (existingImage && isUsableStaticIcon(existingImage)) {
    return {
      ...payload,
      slug: resolvedSlug || cached.slug,
      businessName: (typeof payload.businessName === 'string' && payload.businessName.trim()) || cached.businessName,
    }
  }

  return {
    ...payload,
    slug: resolvedSlug || cached.slug,
    businessName: (typeof payload.businessName === 'string' && payload.businessName.trim()) || cached.businessName,
    avatarImageUrl: cached.avatarImageUrl || cached.icon,
    avatarUrl: cached.avatarUrl || cached.icon,
    avatarVideoUrl:
      (typeof payload.avatarVideoUrl === 'string' && payload.avatarVideoUrl.trim()) || cached.avatarVideoUrl,
  }
}
