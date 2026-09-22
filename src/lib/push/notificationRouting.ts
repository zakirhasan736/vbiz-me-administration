import {
  canOfferPushExperience,
  hasIosPushIntent,
  isIosDevice,
  isPwaStandalone,
  shouldShowIosHomeScreenPushGuide,
} from '@/lib/push/iosPushGuidance'
import {
  clearNotificationDeclinedForCard,
  hasDeclinedNotificationPrompt,
  markNotificationDeclinedForCard,
} from '@/lib/push/notificationExperience'
import { DEFAULT_BACKEND_NOTIFICATION_PREFERENCES, fromBackendPreferences } from '@/lib/push/preferenceMapping'
import { getCachedCardPushStatus, invalidateCardPushStatus, setCachedCardPushStatus } from '@/lib/push/pushStatusCache'
import type { NotificationPreferences } from '@/lib/push/types'
import {
  clearFollowState,
  fetchPushStatus,
  getExistingSubscription,
  getNotificationPermission,
  isPushSupported,
  readFollowState,
  writeFollowState,
} from '@/profile-app/lib/pushNotifications'

export type NotificationModalTarget = 'settings' | 'follow'

function forgetLocalFollow(cardSlug: string) {
  clearFollowState(cardSlug)
  invalidateCardPushStatus(cardSlug)
}

/** True only when this browser is still allowed and the card has a live push subscription. */
export async function isSubscribedToCard(cardSlug: string, options?: { forceRefresh?: boolean }): Promise<boolean> {
  if (!cardSlug.trim()) return false

  const permission = getNotificationPermission()
  if (permission !== 'granted') {
    if (readFollowState(cardSlug)?.following) forgetLocalFollow(cardSlug)
    return false
  }

  const subscription = await getExistingSubscription()
  if (!subscription?.endpoint) {
    if (readFollowState(cardSlug)?.following) forgetLocalFollow(cardSlug)
    return false
  }

  if (!options?.forceRefresh) {
    const cached = getCachedCardPushStatus(cardSlug)
    if (cached && !cached.following) return false
  }

  if (!isPushSupported()) return false

  try {
    const status = await fetchPushStatus(cardSlug, {
      endpoint: subscription.endpoint,
      forceRefresh: options?.forceRefresh ?? true,
    })
    if (!status.following) {
      forgetLocalFollow(cardSlug)
      return false
    }

    const existing = readFollowState(cardSlug)
    const backendPreferences =
      status.backendPreferences ?? existing?.backendPreferences ?? DEFAULT_BACKEND_NOTIFICATION_PREFERENCES
    writeFollowState(cardSlug, {
      following: true,
      preferences: status.preferences ?? fromBackendPreferences(backendPreferences),
      backendPreferences,
      subscribedAt: existing?.subscribedAt ?? new Date().toISOString(),
    })
    return true
  } catch {
    return Boolean(readFollowState(cardSlug)?.following)
  }
}

/** Settings when this browser still has an active subscription; Allow popup otherwise. */
export async function resolveNotificationModalTarget(cardSlug: string): Promise<NotificationModalTarget> {
  if (getNotificationPermission() !== 'granted') return 'follow'
  try {
    const subscribed = await Promise.race([
      isSubscribedToCard(cardSlug, { forceRefresh: true }),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 4000)
      }),
    ])
    return subscribed ? 'settings' : 'follow'
  } catch {
    return 'follow'
  }
}

/** Whether the auto first-visit follow prompt should appear for this card. */
export async function shouldAutoShowNotificationPrompt(cardSlug: string): Promise<boolean> {
  if (!cardSlug.trim()) return false
  if (hasDeclinedNotificationPrompt(cardSlug)) return false

  // iPhone Safari tab: still show so we can guide Add to Home Screen.
  if (!isPushSupported()) {
    if (!canOfferPushExperience()) return false
    if (hasIosPushIntent(cardSlug) && isIosDevice() && isPwaStandalone()) return true
    return shouldShowIosHomeScreenPushGuide()
  }

  // User started setup in Safari and reopened from Home Screen — finish enable.
  if (hasIosPushIntent(cardSlug) && isIosDevice() && isPwaStandalone()) {
    if (readFollowState(cardSlug)?.following) return false
    return true
  }

  // Already enabled for this card in this browser — never re-ask on reload/new tab.
  if (readFollowState(cardSlug)?.following && getNotificationPermission() === 'granted') return false

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
