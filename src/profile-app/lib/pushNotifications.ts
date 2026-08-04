import { clearNotificationDeclinedForCard } from '@/lib/push/notificationExperience'
import type { BackendNotificationPreferences } from '@/lib/push/preferenceMapping'
import { fromBackendPreferences, normalizeBackendPreferences, toBackendPreferences } from '@/lib/push/preferenceMapping'
import { invalidateCardPushStatus, setCachedCardPushStatus } from '@/lib/push/pushStatusCache'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
  type NotificationPreferences,
  type PushPreferencesUpdateResponse,
  type PushStatusResponse,
  type PushSubscriptionPayload,
  type PushSubscriptionStatusResponse,
  type UpdatePreferencesResult,
} from '@/lib/push/types'

export { DEFAULT_NOTIFICATION_PREFERENCES }
export type { NotificationPreferenceKey, NotificationPreferences, UpdatePreferencesResult }

export const SERVICE_WORKER_PATH = '/sw.js'

function getPushApiBase() {
  const base =
    process.env.NEXT_PUBLIC_PUSH_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_PUBLIC_API_URL?.replace(/\/$/, '') ||
    (process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/public`
      : 'http://localhost:5000/api/v1/public')
  return base
}

function pushApiUrl(path: string) {
  return `${getPushApiBase()}/push${path}`
}

export const NOTIFICATION_PREFERENCE_OPTIONS: Array<{ id: NotificationPreferenceKey; label: string }> = [
  { id: 'contact', label: '📞 Updated contact info' },
  { id: 'video', label: '🎬 New videos or photos' },
  { id: 'blog', label: '📝 New blog posts' },
  { id: 'services', label: '🛠️ Services section updates' },
  { id: 'company', label: '🏢 Professional updates' },
  { id: 'events', label: '📅 New events' },
  { id: 'announcements', label: '📢 New announcements' },
]

export function isPushSupported() {
  return (
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  )
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export function followStorageKey(cardSlug: string) {
  return `vbiz_push_follow_${cardSlug.trim().toLowerCase()}`
}

export function subscriptionStorageKey() {
  return 'vbiz_push_subscription'
}

export function readFollowState(cardSlug: string) {
  if (typeof window === 'undefined') return null
  const trimmed = cardSlug.trim()
  if (!trimmed) return null

  const normalizedKey = followStorageKey(trimmed)
  const candidates = [normalizedKey]
  // Legacy key before slug lowercasing.
  const legacyKey = `vbiz_push_follow_${trimmed}`
  if (legacyKey !== normalizedKey) candidates.push(legacyKey)

  for (const key of candidates) {
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as {
        following: boolean
        preferences: NotificationPreferences
        subscribedAt?: string
      }
      if (key !== normalizedKey) {
        localStorage.setItem(normalizedKey, raw)
        localStorage.removeItem(key)
      }
      return parsed
    } catch {
      /* try next */
    }
  }
  return null
}

export function writeFollowState(
  cardSlug: string,
  state: { following: boolean; preferences: NotificationPreferences; subscribedAt?: string }
) {
  const trimmed = cardSlug.trim()
  if (!trimmed) return
  localStorage.setItem(followStorageKey(trimmed), JSON.stringify(state))
}

export function clearFollowState(cardSlug: string) {
  const trimmed = cardSlug.trim()
  if (!trimmed) return
  localStorage.removeItem(followStorageKey(trimmed))
  localStorage.removeItem(`vbiz_push_follow_${trimmed}`)
}

export function readStoredSubscription(): PushSubscriptionPayload | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(subscriptionStorageKey())
  if (!raw) return null
  try {
    return JSON.parse(raw) as PushSubscriptionPayload
  } catch {
    return null
  }
}

export function writeStoredSubscription(subscription: PushSubscription) {
  const payload = subscriptionToPayload(subscription)
  localStorage.setItem(subscriptionStorageKey(), JSON.stringify(payload))
  return payload
}

export function clearStoredSubscription() {
  localStorage.removeItem(subscriptionStorageKey())
}

export function subscriptionToPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON()
  return {
    endpoint: json.endpoint!,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
    },
  }
}

export const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null
  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: '/',
      updateViaCache: 'none',
    })
    // Pick up a newer sw.js as soon as it is deployed.
    void registration.update()
    // Activate updated worker immediately so notification icons are not stuck on next.svg.
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

export async function getReadyRegistration() {
  if (!isPushSupported()) return null
  const registration = await registerServiceWorker()
  if (!registration) return null
  return navigator.serviceWorker.ready
}

export async function getExistingSubscription() {
  const registration = await getReadyRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

export async function resolvePushSubscriptionPayload(): Promise<PushSubscriptionPayload | null> {
  const existing = await getExistingSubscription()
  if (existing) {
    return subscriptionToPayload(existing)
  }
  return null
}

export async function resolvePushEndpoint(): Promise<string | null> {
  const payload = await resolvePushSubscriptionPayload()
  return payload?.endpoint ?? null
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  return 'Unknown'
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Unknown'
}

export async function fetchPushStatus(
  cardSlug: string,
  options?: { endpoint?: string | null; forceRefresh?: boolean }
): Promise<PushStatusResponse> {
  const resolvedEndpoint = options?.endpoint ?? (await resolvePushSubscriptionPayload())?.endpoint ?? null

  if (!resolvedEndpoint) {
    return {
      following: false,
      preferences: null,
      backendPreferences: null,
      permission: getNotificationPermission(),
      endpoint: null,
    }
  }

  const response = await fetch(
    pushApiUrl(`/subscription-status/${encodeURIComponent(cardSlug)}?endpoint=${encodeURIComponent(resolvedEndpoint)}`)
  )

  if (!response.ok) {
    return {
      following: false,
      preferences: null,
      backendPreferences: null,
      permission: getNotificationPermission(),
      endpoint: resolvedEndpoint,
    }
  }

  const json = (await response.json()) as PushSubscriptionStatusResponse
  const backendPreferences = json.preferences ? normalizeBackendPreferences(json.preferences) : null
  const preferences = backendPreferences ? fromBackendPreferences(backendPreferences) : null
  const following = Boolean(json.subscribed)

  setCachedCardPushStatus(cardSlug, { following, preferences })

  return {
    following,
    preferences,
    backendPreferences,
    permission: getNotificationPermission(),
    endpoint: resolvedEndpoint,
  }
}

export async function subscribeToCard(options: {
  cardSlug: string
  cardOwnerId?: string
  preferences?: Partial<NotificationPreferences>
}) {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.')
  }

  // Always (re)ask the browser when the user clicks Enable. If it was previously
  // denied the browser will not re-prompt, so guide the user to re-enable it.
  let permission: NotificationPermission = Notification.permission
  if (permission !== 'granted') {
    permission = await Notification.requestPermission()
  }

  if (permission === 'denied') {
    throw new Error(
      'Notifications are blocked for this site. Tap the lock icon in your browser address bar, allow Notifications, then try again.'
    )
  }

  if (permission !== 'granted') {
    throw new Error('Please choose "Allow" on the notification prompt to enable updates.')
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.')
  }

  const registration = await getReadyRegistration()
  if (!registration) {
    throw new Error('Could not register the service worker.')
  }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  const payload = writeStoredSubscription(subscription)
  const preferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...options.preferences,
  }

  const response = await fetch(pushApiUrl('/subscribe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      profile_slug: options.cardSlug,
      endpoint: payload.endpoint,
      keys: payload.keys,
      browser: detectBrowser(),
      platform: detectPlatform(),
    }),
  })

  if (!response.ok) {
    let message = 'Could not save subscription.'
    try {
      const error = (await response.json()) as { message?: string; error?: string }
      message = error.message || error.error || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  clearNotificationDeclinedForCard(options.cardSlug)
  writeFollowState(options.cardSlug, {
    following: true,
    preferences,
    subscribedAt: new Date().toISOString(),
  })
  setCachedCardPushStatus(options.cardSlug, { following: true, preferences })

  // Ensure backend preference flags are enabled so pushes are not filtered out.
  try {
    await updateCardPreferences(options.cardSlug, preferences)
  } catch (preferenceError) {
    console.warn('Push subscribed, but preferences update failed:', preferenceError)
  }

  return { subscription, preferences }
}

export async function updateCardBackendPreferences(
  cardSlug: string,
  preferences: BackendNotificationPreferences
): Promise<UpdatePreferencesResult> {
  const stored = await resolvePushSubscriptionPayload()
  if (!stored) {
    throw new Error('No browser push subscription found. Enable notifications first.')
  }

  const response = await fetch(pushApiUrl('/preferences'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      profile_slug: cardSlug,
      endpoint: stored.endpoint,
      preferences,
    }),
  })

  let payload: PushPreferencesUpdateResponse = {}
  try {
    payload = (await response.json()) as PushPreferencesUpdateResponse
  } catch {
    /* ignore parse errors */
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Could not update your notification preferences.')
  }

  const savedPreferences = normalizeBackendPreferences(payload.preferences ?? preferences)
  const uiPreferences = fromBackendPreferences(savedPreferences)

  setCachedCardPushStatus(cardSlug, { following: true, preferences: uiPreferences })

  return {
    message: payload.message ?? 'Your notification preferences were updated.',
    preferences: savedPreferences,
  }
}

export async function updateCardPreferences(
  cardSlug: string,
  preferences: NotificationPreferences,
  options?: { backendBase?: Partial<BackendNotificationPreferences> }
): Promise<UpdatePreferencesResult> {
  return updateCardBackendPreferences(cardSlug, toBackendPreferences(preferences, options?.backendBase))
}

export async function unsubscribeFromCard(cardSlug: string) {
  const stored = await resolvePushSubscriptionPayload()

  if (stored) {
    await fetch(pushApiUrl('/unsubscribe'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        profile_slug: cardSlug,
        endpoint: stored.endpoint,
      }),
    }).catch(() => {
      /* still clear browser state if backend call fails */
    })
  }

  const registration = await getReadyRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
  }

  clearStoredSubscription()
  clearFollowState(cardSlug)
  invalidateCardPushStatus(cardSlug)
}

export async function sendTestNotification(cardSlug: string, title?: string, body?: string) {
  const response = await fetch(pushApiUrl('/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardSlug, title, body }),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(error?.error ?? 'Could not send test notification.')
  }

  return response.json()
}
