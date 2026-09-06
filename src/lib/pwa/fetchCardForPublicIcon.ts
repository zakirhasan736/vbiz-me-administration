import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { PublicCardApiError } from '@/lib/api/myCard/publicCardApiError'
import type { MyCardData } from '@interfaces/api/myCard'

/** Fresh enough to skip another public-card fetch for concurrent icon sizes. */
const ICON_CARD_TTL_MS = 60_000
/** After TTL, still reuse on rate-limit / transient API failure instead of blank icons. */
const ICON_CARD_STALE_MS = 10 * 60_000

type CacheEntry = { at: number; data: MyCardData | null }

const successCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<MyCardData | null>>()

function cacheKey(slug: string): string {
  return slug.trim().toLowerCase()
}

function canServeStale(error: unknown): boolean {
  if (!(error instanceof PublicCardApiError)) return false
  return error.kind === 'RATE_LIMITED' || error.kind === 'PUBLIC_CARD_API_ERROR' || error.kind === 'NETWORK_ERROR'
}

/**
 * Card payload for PWA icon routes only.
 * Dedupes concurrent icon/192 + icon/512 fetches and keeps a short in-memory cache
 * (React `cache` does not span separate HTTP requests).
 */
export async function fetchCardForPublicIcon(slug: string): Promise<MyCardData | null> {
  const key = cacheKey(slug)
  if (!key) return null

  const cached = successCache.get(key)
  if (cached && Date.now() - cached.at < ICON_CARD_TTL_MS) {
    return cached.data
  }

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = (async () => {
    try {
      const data = await fetchMyCardBySlug(slug)
      successCache.set(key, { at: Date.now(), data })
      return data
    } catch (error) {
      if (cached && Date.now() - cached.at < ICON_CARD_STALE_MS && canServeStale(error)) {
        return cached.data
      }
      throw error
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise
}

/** Clears module caches — tests only. */
export function clearPublicIconCardCacheForTests() {
  successCache.clear()
  inflight.clear()
}
