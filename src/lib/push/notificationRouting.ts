import {
  clearNotificationDeclinedForCard,
  hasDeclinedNotificationPrompt,
  markNotificationDeclinedForCard,
} from '@/lib/push/notificationExperience'
import { DEFAULT_BACKEND_NOTIFICATION_PREFERENCES, fromBackendPreferences } from '@/lib/push/preferenceMapping'
import { getCachedCardPushStatus, invalidateCardPushStatus, setCachedCardPushStatus } from '@/lib/push/pushStatusCache'
import type { NotificationPreferences } from '@/lib/push/types'
import {
  fetchPushStatus,
  getExistingSubscription,
  getNotificationPermission,
  isPushSupported,
  readFollowState,
  writeFollowState,
} from '@/profile-app/lib/pushNotifications'

export type NotificationModalTarget = 'settings' | 'follow'

/** True when this browser already opted in for the card (local or backend). */
export async function isSubscribedToCard(cardSlug: string, options?: { forceRefresh?: boolean }): Promise<boolean> {
  if (!cardSlug.trim()) return false

  // Durable local opt-in — survives hard reload / new tab.
  if (readFollowState(cardSlug)?.following) {
    if (!options?.forceRefresh) return true
  }

  if (!options?.forceRefresh) {
    const cached = getCachedCardPushStatus(cardSlug)
    if (cached) return cached.following
  }

  if (!isPushSupported()) return false

  try {
    const status = await fetchPushStatus(cardSlug, { forceRefresh: options?.forceRefresh })
    if (status.following) {
      // Keep local follow in sync so future reloads don't wait on the API.
      const existing = readFollowState(cardSlug)
      const backendPreferences =
        status.backendPreferences ?? existing?.backendPreferences ?? DEFAULT_BACKEND_NOTIFICATION_PREFERENCES
      writeFollowState(cardSlug, {
        following: true,
        preferences: status.preferences ?? fromBackendPreferences(backendPreferences),
        backendPreferences,
        subscribedAt: existing?.subscribedAt ?? new Date().toISOString(),
      })
    }
    return status.following
  } catch {
    // If the API fails but the user already followed locally, treat as subscribed.
    return Boolean(readFollowState(cardSlug)?.following)
  }
}

/** Route alert / bell clicks: settings when API says subscribed, follow popup otherwise. */
export async function resolveNotificationModalTarget(cardSlug: string): Promise<NotificationModalTarget> {
  return (await isSubscribedToCard(cardSlug)) ? 'settings' : 'follow'
}

/** Whether the auto first-visit follow prompt should appear for this card. */
export async function shouldAutoShowNotificationPrompt(cardSlug: string): Promise<boolean> {
  if (!cardSlug.trim()) return false
  if (hasDeclinedNotificationPrompt(cardSlug)) return false
  if (!isPushSupported()) return false

  // Already enabled for this card in this browser — never re-ask on reload/new tab.
  if (readFollowState(cardSlug)?.following) return false

  const permission = getNotificationPermission()
  if (permission === 'granted') {
    // Wait for the existing push subscription so we don't false-negative while SW boots.
    const subscription = await getExistingSubscription()
    if (subscription) {
      const subscribed = await isSubscribedToCard(cardSlug, { forceRefresh: true })
      if (subscribed) return false
    }
  }

  return !(await isSubscribedToCard(cardSlug))
}

/** Refresh subscription state from GET /push/subscription-status. */
export async function syncCardSubscriptionStatus(cardSlug: string): Promise<boolean> {
  if (!cardSlug.trim() || !isPushSupported()) return false

  try {
    const status = await fetchPushStatus(cardSlug, { forceRefresh: true })
    if (status.following) {
      const existing = readFollowState(cardSlug)
      const backendPreferences =
        status.backendPreferences ?? existing?.backendPreferences ?? DEFAULT_BACKEND_NOTIFICATION_PREFERENCES
      writeFollowState(cardSlug, {
        following: true,
        preferences: status.preferences ?? fromBackendPreferences(backendPreferences),
        backendPreferences,
        subscribedAt: existing?.subscribedAt ?? new Date().toISOString(),
      })
    }
    return status.following
  } catch {
    return Boolean(readFollowState(cardSlug)?.following)
  }
}

export function markNotificationDeclined(cardSlug: string) {
  markNotificationDeclinedForCard(cardSlug)
}

export function markNotificationSubscribed(cardSlug: string) {
  clearNotificationDeclinedForCard(cardSlug)
  invalidateCardPushStatus(cardSlug)

  const existing = readFollowState(cardSlug)
  const backendPreferences = existing?.backendPreferences ?? DEFAULT_BACKEND_NOTIFICATION_PREFERENCES
  const preferences = existing?.preferences ?? fromBackendPreferences(backendPreferences)

  writeFollowState(cardSlug, {
    following: true,
    preferences,
    backendPreferences,
    subscribedAt: existing?.subscribedAt ?? new Date().toISOString(),
  })

  setCachedCardPushStatus(cardSlug, {
    following: true,
    preferences,
    backendPreferences,
  })
}

export async function getCardNotificationPreferences(cardSlug: string): Promise<NotificationPreferences | null> {
  const cached = getCachedCardPushStatus(cardSlug)
  if (cached?.preferences) return cached.preferences

  const local = readFollowState(cardSlug)
  if (local?.preferences) return local.preferences

  try {
    const status = await fetchPushStatus(cardSlug)
    return status.preferences
  } catch {
    return null
  }
}
