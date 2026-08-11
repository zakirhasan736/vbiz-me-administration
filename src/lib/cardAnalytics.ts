/**
 * Frontend card analytics helpers.
 * Mock/local increments work now; later swap persistence to backend API.
 */

import { getCardSocialClickStats, type SocialPlatformKey } from '@/lib/adminSocialStats'
import type { VCardData } from '@/types/vcard'

export type CardAnalytics = {
  viewCount: number
  uniqueViewCount: number
  shareCount: number
  saveCount: number
}

const LOCAL_KEY = 'vbiz_card_analytics_v1'
export const CARD_ANALYTICS_EVENT = 'vbiz_card_analytics_update'

type Store = Record<string, Partial<CardAnalytics>>

function loadStore(): Store {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function persist(store: Store) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
  window.dispatchEvent(new Event(CARD_ANALYTICS_EVENT))
}

export function getLocalCardAnalytics(cardId: string): Partial<CardAnalytics> {
  if (!cardId) return {}
  return loadStore()[cardId] || {}
}

/** Merge card seed fields + local live increments (bumps add on top of seed) */
export function resolveCardAnalytics(
  card:
    | Partial<
        VCardData & {
          id?: string
          viewCount?: number
          uniqueViewCount?: number
          shareCount?: number
          saveCount?: number
        }
      >
    | null
    | undefined
): CardAnalytics {
  const id = card?.id || ''
  const local = id ? getLocalCardAnalytics(id) : {}
  // Also resolve by slug when id bumps used slug as key
  const slugLocal = card?.slug && card.slug !== id ? getLocalCardAnalytics(card.slug) : {}
  return {
    viewCount:
      (Number(card?.viewCount ?? 0) || 0) +
      (Number(local.viewCount ?? 0) || 0) +
      (Number(slugLocal.viewCount ?? 0) || 0),
    uniqueViewCount:
      (Number(card?.uniqueViewCount ?? 0) || 0) +
      (Number(local.uniqueViewCount ?? 0) || 0) +
      (Number(slugLocal.uniqueViewCount ?? 0) || 0),
    shareCount:
      (Number(card?.shareCount ?? 0) || 0) +
      (Number(local.shareCount ?? 0) || 0) +
      (Number(slugLocal.shareCount ?? 0) || 0),
    saveCount:
      (Number(card?.saveCount ?? 0) || 0) +
      (Number(local.saveCount ?? 0) || 0) +
      (Number(slugLocal.saveCount ?? 0) || 0),
  }
}

export function bumpLocalCardAnalytics(cardId: string, field: keyof CardAnalytics, by = 1): CardAnalytics {
  const store = loadStore()
  const prev = store[cardId] || {}
  const next = {
    ...prev,
    [field]: Math.max(0, Number(prev[field] || 0) + by),
  }
  store[cardId] = next
  persist(store)
  return {
    viewCount: Number(next.viewCount || 0),
    uniqueViewCount: Number(next.uniqueViewCount || 0),
    shareCount: Number(next.shareCount || 0),
    saveCount: Number(next.saveCount || 0),
  }
}

export function aggregateCardsAnalytics(
  cards: Array<
    Partial<
      VCardData & { id?: string; viewCount?: number; uniqueViewCount?: number; shareCount?: number; saveCount?: number }
    >
  >
): CardAnalytics {
  return cards.reduce<CardAnalytics>(
    (acc, card) => {
      const a = resolveCardAnalytics(card)
      acc.viewCount += a.viewCount
      acc.uniqueViewCount += a.uniqueViewCount
      acc.shareCount += a.shareCount
      acc.saveCount += a.saveCount
      return acc
    },
    { viewCount: 0, uniqueViewCount: 0, shareCount: 0, saveCount: 0 }
  )
}

/** Aggregate social clicks across cards (live link click data, no invented totals) */
export function aggregatePlatformSocialClicks(
  cards: Array<{ id?: string; slug?: string; socials?: unknown }>,
  clicksByCardId: Record<string, { label?: string; url?: string; clickCount?: number }[]>
): Record<SocialPlatformKey, number> {
  const totals: Record<SocialPlatformKey, number> = {
    facebook: 0,
    twitter: 0,
    instagram: 0,
    whatsapp: 0,
    linkedin: 0,
    youtube: 0,
    tiktok: 0,
    web: 0,
  }

  for (const card of cards) {
    const id = card.id || ''
    const clicks = clicksByCardId[id] || []
    const stats = getCardSocialClickStats(
      card,
      clicks.map((c) => ({
        channel: c.label || c.url || 'web',
        label: c.label || c.url || 'web',
        clickCount: Number(c.clickCount) || 0,
      }))
    )
    for (const s of stats) {
      totals[s.platform] = (totals[s.platform] || 0) + (s.clickCount || 0)
    }
  }
  return totals
}

/** Simple cumulative chart points from a total */
export function buildViewsChartData(total: number, months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']) {
  const ratios = [0.087, 0.132, 0.172, 0.273, 0.38, 1]
  const t = Math.max(0, Number(total) || 0)
  return months.map((name, i) => ({
    name,
    total: i === months.length - 1 ? t : Math.max(t > 0 ? 1 : 0, Math.round(t * (ratios[i] || 1))),
  }))
}
