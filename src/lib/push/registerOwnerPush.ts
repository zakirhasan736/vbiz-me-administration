import {
  assertValidVapidPublicKey,
  getReadyRegistration,
  isPushSupported,
  resolveVapidPublicKey,
  subscriptionToPayload,
  vapidKeyToArrayBuffer,
} from '@/profile-app/lib/pushNotifications'
import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

type ProfileListRow = { id?: string }

const OWNER_PUSH_PENDING_KEY = 'vbiz_owner_push_pending'
const OWNER_PUSH_OK_KEY = 'vbiz_owner_push_ok_at'
const OWNER_PUSH_VAPID_KEY = 'vbiz_owner_push_vapid'

function waitForAuthToken(maxMs = 15000): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  const existing = store.getState().user.token
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    const started = Date.now()
    const tick = window.setInterval(() => {
      const token = store.getState().user.token
      if (token) {
        window.clearInterval(tick)
        resolve(token)
        return
      }
      if (Date.now() - started >= maxMs) {
        window.clearInterval(tick)
        resolve(null)
      }
    }, 200)
  })
}

function profileIdsFromListResponse(json: unknown): string[] {
  if (!json || typeof json !== 'object') return []
  const root = json as {
    data?: ProfileListRow[] | { items?: ProfileListRow[] }
    items?: ProfileListRow[]
  }
  const rows = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.data?.items)
      ? root.data.items
      : Array.isArray(root.items)
        ? root.items
        : []
  return rows.map((row) => row.id).filter((id): id is string => Boolean(id))
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

export function markOwnerPushPending() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OWNER_PUSH_PENDING_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearOwnerPushPending() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(OWNER_PUSH_PENDING_KEY)
    localStorage.setItem(OWNER_PUSH_OK_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function isOwnerPushPending(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(OWNER_PUSH_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

function persistVapidPublicKey(publicKey: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OWNER_PUSH_VAPID_KEY, publicKey)
    // SW can read this via clients / cache for pushsubscriptionchange resubscribe.
    void caches.open('vbiz-owner-push-meta').then((cache) =>
      cache.put(
        '/__vbiz_owner_vapid',
        new Response(JSON.stringify({ publicKey }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
  } catch {
    /* ignore */
  }
}

async function postOwnerSubscribe(
  profileId: string,
  token: string,
  payload: ReturnType<typeof subscriptionToPayload>
): Promise<boolean> {
  const body = {
    profileId,
    endpoint: payload.endpoint,
    keys: payload.keys,
    browser: navigator.userAgent.includes('Firefox')
      ? 'firefox'
      : navigator.userAgent.includes('Edg')
        ? 'edge'
        : 'chrome',
    platform: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
  }

  // Prefer same-origin proxy (reliable after first Allow with tab closed later).
  try {
    const proxied = await fetch('/api/owner-push/subscribe', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (proxied.ok) return true
  } catch {
    /* fall through to direct API */
  }

  const apiRoot = baseUrl.replace(/\/$/, '')
  try {
    const res = await fetch(`${apiRoot}/profiles/${encodeURIComponent(profileId)}/push/subscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: body.endpoint,
        keys: body.keys,
        audience: 'owner',
        browser: body.browser,
        platform: body.platform,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Register this browser as an **owner** Web Push device for each owned card.
 * Distinct from public-card follower subscriptions (savers who allow notifications).
 * Once saved, Chrome/Firefox deliver OS push even with the backoffice tab closed.
 */
export async function registerOwnerPushForProfiles(profileIds: string[]): Promise<{ registered: number }> {
  const ids = [...new Set(profileIds.map((id) => id.trim()).filter(Boolean))]
  if (!ids.length || !isPushSupported()) return { registered: 0 }

  const token = (await waitForAuthToken()) || store.getState().user.token
  if (!token) {
    markOwnerPushPending()
    return { registered: 0 }
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return { registered: 0 }
  }

  markOwnerPushPending()

  try {
    const publicKey = await resolveVapidPublicKey()
    const keyBytes = assertValidVapidPublicKey(publicKey)
    persistVapidPublicKey(publicKey)

    // Wait for an active controlling worker — subscribe before ready often fails silently.
    const registration = await getReadyRegistration()
    if (!registration?.pushManager) return { registered: 0 }

    let subscription = await registration.pushManager.getSubscription()
    // Stale follower/env key must be replaced or OS push never arrives after Allow.
    if (subscription && !subscriptionMatchesVapidKey(subscription, keyBytes)) {
      await subscription.unsubscribe().catch(() => null)
      subscription = null
    }
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyToArrayBuffer(keyBytes),
      })
    }

    const payload = subscriptionToPayload(subscription)
    let registered = 0

    for (const profileId of ids) {
      const ok = await postOwnerSubscribe(profileId, token, payload)
      if (ok) registered += 1
    }

    if (registered > 0) {
      clearOwnerPushPending()
    }

    return { registered }
  } catch {
    return { registered: 0 }
  }
}

/** Load owned profile ids and register owner push for this browser. */
export async function registerOwnerPushForCurrentUser(): Promise<{ registered: number }> {
  const token = await waitForAuthToken()
  if (!token) {
    markOwnerPushPending()
    return { registered: 0 }
  }

  const apiRoot = baseUrl.replace(/\/$/, '')
  try {
    const res = await fetch(`${apiRoot}/profiles?limit=100`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      markOwnerPushPending()
      return { registered: 0 }
    }
    const json: unknown = await res.json()
    const ids = profileIdsFromListResponse(json)
    if (!ids.length) {
      markOwnerPushPending()
      return { registered: 0 }
    }
    return registerOwnerPushForProfiles(ids)
  } catch {
    markOwnerPushPending()
    return { registered: 0 }
  }
}
