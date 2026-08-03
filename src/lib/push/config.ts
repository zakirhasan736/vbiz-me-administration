/**
 * Central push notification configuration shared across all profile templates (v1, v2, v3).
 */
import type { NotificationPreferences } from '@/lib/push/types'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_OPTIONS,
  SERVICE_WORKER_PATH,
  fetchPushStatus,
  followStorageKey,
  getNotificationPermission,
  getReadyRegistration,
  isPushSupported,
  readFollowState,
  readStoredSubscription,
  registerServiceWorker,
  resolvePushEndpoint,
  resolvePushSubscriptionPayload,
  sendTestNotification,
  subscribeToCard,
  subscriptionStorageKey,
  unsubscribeFromCard,
  updateCardBackendPreferences,
  updateCardPreferences,
  urlBase64ToUint8Array,
  writeFollowState,
} from '@/profile-app/lib/pushNotifications'

export {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_OPTIONS,
  SERVICE_WORKER_PATH,
  fetchPushStatus,
  followStorageKey,
  getNotificationPermission,
  getReadyRegistration,
  isPushSupported,
  readFollowState,
  readStoredSubscription,
  registerServiceWorker,
  resolvePushEndpoint,
  resolvePushSubscriptionPayload,
  sendTestNotification,
  subscribeToCard,
  subscriptionStorageKey,
  unsubscribeFromCard,
  updateCardBackendPreferences,
  updateCardPreferences,
  urlBase64ToUint8Array,
  writeFollowState,
}

export { enrichPushPayloadWithCardMedia, writeCardPushMedia } from '@/lib/push/cardPushMediaCache'
export type { CardPushMedia } from '@/lib/push/cardPushMediaCache'
export { initialsFromName, isVideoAvatarSrc, resolveNotificationAvatar } from '@/lib/push/resolveNotificationAvatar'

export type { NotificationPreferenceKey, NotificationPreferences, UpdatePreferencesResult } from '@/lib/push/types'

export {
  FORCE_NOTIFICATION_DELAY_MS,
  PLATFORM_UPDATE_EVENT,
  PROFILE_EXPERIENCE_SETTLED_EVENT,
  hasContactFlowBeenAsked,
  hasNotificationChoice,
  hasNotificationChoiceForCard,
  isProfileExperienceSettled,
  isSubscribedAnywhere,
  notificationChoiceKey,
  notificationChoiceKeyForCard,
  notifyProfileExperienceSettled,
  writeContactFlowAsked,
  writeNotificationChoice,
  writeNotificationChoiceForCard,
} from '@/lib/push/notificationExperience'

/** Preference options shown in post-contact ask modal (v3 — four categories). */
export const FORCE_ASK_PREFERENCE_OPTIONS = NOTIFICATION_PREFERENCE_OPTIONS.filter((option) => option.id !== 'services')

/** Legacy v3 localStorage key pattern (cardOwnerId scoped). */
export function legacyNotifPrefsKey(cardOwnerId: string) {
  return `vbizme_notif_${cardOwnerId}`
}

/** Legacy v3 notification choice key. */
export const LEGACY_NOTIFICATION_CHOICE_KEY = 'vbiz_notification_choice'

export const PUSH_CONFIG = {
  serviceWorkerPath: SERVICE_WORKER_PATH,
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  preferenceOptions: NOTIFICATION_PREFERENCE_OPTIONS,
  defaultPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  legacyNotifPrefsKey,
  notificationChoiceKey: LEGACY_NOTIFICATION_CHOICE_KEY,
} as const

export function getVapidPublicKey(): string {
  return PUSH_CONFIG.vapidPublicKey
}

export function isVapidConfigured(): boolean {
  return Boolean(PUSH_CONFIG.vapidPublicKey.trim())
}

export {
  getCardNotificationPreferences,
  isSubscribedToCard,
  markNotificationDeclined,
  markNotificationSubscribed,
  resolveNotificationModalTarget,
  shouldAutoShowNotificationPrompt,
  syncCardSubscriptionStatus,
} from '@/lib/push/notificationRouting'
export type { NotificationModalTarget } from '@/lib/push/notificationRouting'

/** v3-compatible subscribe helper — delegates to central push API. */
export async function subscribeUserToPush(options: {
  cardSlug: string
  cardOwnerId?: string
  preferences?: Partial<NotificationPreferences>
}) {
  if (!isVapidConfigured()) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.')
  }
  await registerServiceWorker()
  return subscribeToCard(options)
}
