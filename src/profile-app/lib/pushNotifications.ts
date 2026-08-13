import { clearNotificationDeclinedForCard } from '@/lib/push/notificationExperience'
import type { BackendNotificationPreferences } from '@/lib/push/preferenceMapping'
import {
  DEFAULT_BACKEND_NOTIFICATION_PREFERENCES,
  fromBackendPreferences,
  normalizeBackendPreferences,
  toBackendPreferences,
} from '@/lib/push/preferenceMapping'
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
import { baseUrl as publicApiBaseUrl } from '@/redux/api/publicApi'

export { DEFAULT_NOTIFICATION_PREFERENCES }
export type { NotificationPreferenceKey, NotificationPreferences, UpdatePreferencesResult }

export type FollowState = {
  following: boolean
  preferences: NotificationPreferences
  backendPreferences?: BackendNotificationPreferences
  subscribedAt?: string
}

export const SERVICE_WORKER_PATH = '/sw.js'

function getPushApiBase() {
  return process.env.NEXT_PUBLIC_PUSH_API_URL?.replace(/\/$/, '') || publicApiBaseUrl.replace(/\/$/, '')
}

function pushApiUrl(path: string) {
  return `${getPushApiBase()}/push${path}`
}

/** Public API uses `{ success, data }`; accept flat payloads too. */
function unwrapPublicPayload<T extends Record<string, unknown>>(json: unknown): T {
  if (!json || typeof json !== 'object') return {} as T
  const record = json as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    return record.data as T
  }
  return record as T
}

function hasOtherActiveFollows(exceptCardSlug: string) {
  if (typeof window === 'undefined') return false
  const except = followStorageKey(exceptCardSlug)
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('vbiz_push_follow_') || key === except) continue
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '') as { following?: boolean }
      if (parsed?.following) return true
    } catch {
      /* ignore */
    }
  }
  return false
}

function isBackendPreferenceRecord(
  prefs: Partial<NotificationPreferences> | Partial<BackendNotificationPreferences>
): prefs is Partial<BackendNotificationPreferences> {
  return Object.keys(prefs).some((key) => key in DEFAULT_BACKEND_NOTIFICATION_PREFERENCES)
}

/** Normalize subscribe/update payloads to the 9 backend preference keys. */
export function coerceToBackendPreferences(
  prefs?: Partial<NotificationPreferences> | Partial<BackendNotificationPreferences> | null
): BackendNotificationPreferences {
  if (!prefs || Object.keys(prefs).length === 0) {
    return { ...DEFAULT_BACKEND_NOTIFICATION_PREFERENCES }
  }
  if (isBackendPreferenceRecord(prefs)) {
    return normalizeBackendPreferences(prefs)
  }
  return toBackendPreferences(prefs as Partial<NotificationPreferences>)
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

export function readFollowState(cardSlug: string): FollowState | null {
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
      const parsed = JSON.parse(raw) as Partial<FollowState> & {
        preferences?: NotificationPreferences | BackendNotificationPreferences
      }
      if (!parsed || typeof parsed.following !== 'boolean') continue

      const backendPreferences = parsed.backendPreferences
        ? normalizeBackendPreferences(parsed.backendPreferences)
        : parsed.preferences && isBackendPreferenceRecord(parsed.preferences)
          ? normalizeBackendPreferences(parsed.preferences)
          : parsed.preferences
            ? toBackendPreferences(parsed.preferences as NotificationPreferences)
            : { ...DEFAULT_BACKEND_NOTIFICATION_PREFERENCES }

      const preferences = fromBackendPreferences(backendPreferences)
      const state: FollowState = {
        following: parsed.following,
        preferences,
        backendPreferences,
        subscribedAt: parsed.subscribedAt,
      }

      if (key !== normalizedKey || !parsed.backendPreferences) {
        localStorage.setItem(normalizedKey, JSON.stringify(state))
        if (key !== normalizedKey) localStorage.removeItem(key)
      }
      return state
    } catch {
      /* try next */
    }
  }
  return null
}

export function writeFollowState(cardSlug: string, state: FollowState) {
  const trimmed = cardSlug.trim()
  if (!trimmed) return
  const backendPreferences = state.backendPreferences
    ? normalizeBackendPreferences(state.backendPreferences)
    : toBackendPreferences(state.preferences)
  const normalized: FollowState = {
    following: state.following,
    preferences: fromBackendPreferences(backendPreferences),
    backendPreferences,
    subscribedAt: state.subscribedAt,
  }
  localStorage.setItem(followStorageKey(trimmed), JSON.stringify(normalized))
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

/** Uncompressed P-256 VAPID public keys decode to 65 bytes (0x04 || x || y). */
export function assertValidVapidPublicKey(base64String: string): Uint8Array {
  const trimmed = base64String.trim()
  if (!trimmed) {
    throw new Error('Push public key is empty. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY or configure the API.')
  }
  let keyBytes: Uint8Array
  try {
    keyBytes = urlBase64ToUint8Array(trimmed)
  } catch {
    throw new Error('Push public key is invalid. Check NEXT_PUBLIC_VAPID_PUBLIC_KEY / server VAPID_PUBLIC_KEY.')
  }
  if (keyBytes.length !== 65 || keyBytes[0] !== 0x04) {
    throw new Error(
      'Push public key has the wrong format (expected a 65-byte uncompressed VAPID key). Regenerate with web-push generate-vapid-keys.'
    )
  }
  return keyBytes
}

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function subscriptionMatchesVapidKey(subscription: PushSubscription, vapidKeyBytes: Uint8Array) {
  const existingKey = subscription.options?.applicationServerKey
  if (!existingKey) return false
  return uint8ArraysEqual(new Uint8Array(existingKey), vapidKeyBytes)
}

export function mapPushSubscribeError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Could not enable notifications.')
  }

  const name = 'name' in error ? String((error as { name?: string }).name) : ''
  const message = error.message || ''
  const lower = message.toLowerCase()

  if (name === 'NotAllowedError' || lower.includes('permission')) {
    return new Error(
      'Notifications are blocked for this site. Tap the lock icon in your browser address bar, allow Notifications, then try again.'
    )
  }

  if (name === 'AbortError' || lower.includes('push service') || lower.includes('registration failed')) {
    return new Error(
      'Your browser could not reach its push service. Try Chrome or Edge, turn off VPN/ad-blockers that block Google push, or in Brave enable “Use Google services for push messaging”. Then clear this site’s notification data and try again.'
    )
  }

  if (name === 'InvalidStateError' || lower.includes('service worker')) {
    return new Error('The notification service worker is not ready yet. Refresh the page and try again.')
  }

  return error
}

/** Prefer live server public key so FE/BE stay aligned; fall back to build-time env. */
export async function resolveVapidPublicKey(): Promise<string> {
  try {
    const response = await fetch(pushApiUrl('/vapid-public-key'), {
      headers: { Accept: 'application/json' },
    })
    if (response.ok) {
      const json = unwrapPublicPayload<{ publicKey?: string; public_key?: string }>(await response.json())
      const liveKey = (json.publicKey || json.public_key || '').trim()
      if (liveKey) return liveKey
    }
  } catch {
    /* fall through to env */
  }

  const envKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
  if (!envKey) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.')
  }
  return envKey
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null
  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: '/',
      updateViaCache: 'none',
    })
    // Pick up a newer sw.js as soon as it is deployed (storage/blocked SW must not surface as unhandledRejection).
    void registration.update().catch(() => null)
    // Activate updated worker immediately so notification icons are not stuck on next.svg.
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    return registration
  } catch {
    return null
  }
}

export async function getReadyRegistration() {
  if (!isPushSupported()) return null
  const registration = await registerServiceWorker()
  if (!registration) return null

  const ready = await navigator.serviceWorker.ready

  // Ensure an active worker controls the page before PushManager.subscribe.
  if (!ready.active) {
    if (ready.waiting) {
      ready.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    await new Promise<void>((resolve) => {
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
        resolve()
      }
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
      window.setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
        resolve()
      }, 3000)
    })
  }

  if (!ready.active && !(await navigator.serviceWorker.ready).active) {
    return null
  }

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

  const json = unwrapPublicPayload<PushSubscriptionStatusResponse>(await response.json())
  const backendPreferences = json.preferences ? normalizeBackendPreferences(json.preferences) : null
  const preferences = backendPreferences ? fromBackendPreferences(backendPreferences) : null
  const following = Boolean(json.subscribed)

  setCachedCardPushStatus(cardSlug, { following, preferences, backendPreferences })

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
  /** UI keys or backend snake_case keys — coerced to the 9 backend categories. */
  preferences?: Partial<NotificationPreferences> | Partial<BackendNotificationPreferences>
}) {
  try {
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

    const vapidPublicKey = await resolveVapidPublicKey()
    const vapidKeyBytes = assertValidVapidPublicKey(vapidPublicKey)

    const registration = await getReadyRegistration()
    if (!registration?.active) {
      throw new Error('Could not register the service worker.')
    }

    let subscription: PushSubscription | null = await registration.pushManager.getSubscription()
    if (subscription && !subscriptionMatchesVapidKey(subscription, vapidKeyBytes)) {
      await subscription.unsubscribe().catch(() => null)
      clearStoredSubscription()
      subscription = null
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Copy into a plain ArrayBuffer-backed view for DOM BufferSource typing.
        applicationServerKey: vapidKeyBytes.slice().buffer as ArrayBuffer,
      })
    }

    const payload = writeStoredSubscription(subscription)
    const backendPreferences = coerceToBackendPreferences(options.preferences)

    const response = await fetch(pushApiUrl('/subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        profile_slug: options.cardSlug,
        endpoint: payload.endpoint,
        keys: payload.keys,
        browser: detectBrowser(),
        platform: detectPlatform(),
        preferences: backendPreferences,
      }),
    })

    let responseJson: unknown = null
    try {
      responseJson = await response.json()
    } catch {
      /* ignore */
    }

    if (!response.ok) {
      const error = (responseJson && typeof responseJson === 'object' ? responseJson : {}) as {
        message?: string
        error?: string
      }
      throw new Error(error.message || error.error || 'Could not save subscription.')
    }

    const subscribePayload = unwrapPublicPayload<{
      preferences?: Partial<BackendNotificationPreferences>
    }>(responseJson)

    let savedBackendPreferences = subscribePayload.preferences
      ? normalizeBackendPreferences(subscribePayload.preferences)
      : null

    // Fallback if older servers ignore preferences on subscribe.
    if (!savedBackendPreferences) {
      try {
        const result = await updateCardBackendPreferences(options.cardSlug, backendPreferences)
        savedBackendPreferences = result.preferences
      } catch (preferenceError) {
        console.warn('Push subscribed, but preferences update failed:', preferenceError)
        savedBackendPreferences = backendPreferences
      }
    }

    const uiPreferences = fromBackendPreferences(savedBackendPreferences)

    clearNotificationDeclinedForCard(options.cardSlug)
    writeFollowState(options.cardSlug, {
      following: true,
      preferences: uiPreferences,
      backendPreferences: savedBackendPreferences,
      subscribedAt: new Date().toISOString(),
    })
    setCachedCardPushStatus(options.cardSlug, {
      following: true,
      preferences: uiPreferences,
      backendPreferences: savedBackendPreferences,
    })

    return { subscription, preferences: uiPreferences, backendPreferences: savedBackendPreferences }
  } catch (error) {
    console.error('[push] subscribeToCard failed', {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw mapPushSubscribeError(error)
  }
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      profile_slug: cardSlug,
      endpoint: stored.endpoint,
      preferences,
    }),
  })

  let payload: PushPreferencesUpdateResponse = {}
  try {
    payload = unwrapPublicPayload<PushPreferencesUpdateResponse>(await response.json())
  } catch {
    /* ignore parse errors */
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Could not update your notification preferences.')
  }

  const savedPreferences = normalizeBackendPreferences(payload.preferences ?? preferences)
  const uiPreferences = fromBackendPreferences(savedPreferences)

  writeFollowState(cardSlug, {
    following: true,
    preferences: uiPreferences,
    backendPreferences: savedPreferences,
    subscribedAt: readFollowState(cardSlug)?.subscribedAt,
  })
  setCachedCardPushStatus(cardSlug, {
    following: true,
    preferences: uiPreferences,
    backendPreferences: savedPreferences,
  })

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        profile_slug: cardSlug,
        endpoint: stored.endpoint,
      }),
    }).catch(() => {
      /* still clear local follow state if backend call fails */
    })
  }

  clearFollowState(cardSlug)
  invalidateCardPushStatus(cardSlug)

  // Keep the browser PushSubscription if this endpoint still follows other cards.
  if (hasOtherActiveFollows(cardSlug)) {
    return
  }

  const registration = await getReadyRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
  }
  clearStoredSubscription()
}

export async function sendTestNotification(cardSlug: string, title?: string, body?: string) {
  const stored = await resolvePushSubscriptionPayload()
  if (!stored?.endpoint) {
    throw new Error('No browser push subscription found. Enable notifications first.')
  }

  const response = await fetch(pushApiUrl('/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      profile_slug: cardSlug,
      endpoint: stored.endpoint,
      title,
      body,
    }),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string; message?: string } | null
    throw new Error(error?.error ?? error?.message ?? 'Could not send test notification.')
  }

  return unwrapPublicPayload(await response.json())
}
