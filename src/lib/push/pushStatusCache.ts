import type { NotificationPreferences } from '@/lib/push/types'

type CachedCardStatus = {
  following: boolean
  preferences: NotificationPreferences | null
  checkedAt: number
}

const STATUS_CACHE_MS = 60_000
const cardStatusCache = new Map<string, CachedCardStatus>()

function cacheKey(cardSlug: string) {
  return cardSlug.trim().toLowerCase()
}

export function getCachedCardPushStatus(cardSlug: string): CachedCardStatus | null {
  const cached = cardStatusCache.get(cacheKey(cardSlug))
  if (!cached) return null
  if (Date.now() - cached.checkedAt > STATUS_CACHE_MS) {
    cardStatusCache.delete(cacheKey(cardSlug))
    return null
  }
  return cached
}

export function setCachedCardPushStatus(
  cardSlug: string,
  status: { following: boolean; preferences: NotificationPreferences | null }
) {
  cardStatusCache.set(cacheKey(cardSlug), {
    following: status.following,
    preferences: status.preferences,
    checkedAt: Date.now(),
  })
}

export function invalidateCardPushStatus(cardSlug: string) {
  cardStatusCache.delete(cacheKey(cardSlug))
}

export function clearCardPushStatusCache() {
  cardStatusCache.clear()
}
