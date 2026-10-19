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

function waitForAuthToken(maxMs = 10000): Promise<string | null> {
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

/**
 * Register this browser as an **owner** Web Push device for each owned card.
 * Distinct from public-card follower subscriptions (savers who allow notifications).
 * Once saved, Chrome/Firefox deliver OS push even with the backoffice tab closed.
 */
export async function registerOwnerPushForProfiles(profileIds: string[]): Promise<{ registered: number }> {
  const ids = [...new Set(profileIds.map((id) => id.trim()).filter(Boolean))]
  if (!ids.length || !isPushSupported()) return { registered: 0 }

  const token = (await waitForAuthToken()) || store.getState().user.token
  if (!token) return { registered: 0 }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return { registered: 0 }
  }

  try {
    const publicKey = await resolveVapidPublicKey()
    const keyBytes = assertValidVapidPublicKey(publicKey)
    // Wait for an active controlling worker — subscribe before ready often fails silently.
    const registration = await getReadyRegistration()
    if (!registration?.pushManager) return { registered: 0 }

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyToArrayBuffer(keyBytes),
      })
    }

    const payload = subscriptionToPayload(subscription)
    const apiRoot = baseUrl.replace(/\/$/, '')
    let registered = 0

    for (const profileId of ids) {
      try {
        const res = await fetch(`${apiRoot}/profiles/${encodeURIComponent(profileId)}/push/subscribe`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: payload.endpoint,
            keys: payload.keys,
            audience: 'owner',
            browser: navigator.userAgent.includes('Firefox')
              ? 'firefox'
              : navigator.userAgent.includes('Edg')
                ? 'edge'
                : 'chrome',
            platform: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          }),
        })
        if (res.ok) registered += 1
      } catch {
        /* continue other cards */
      }
    }

    return { registered }
  } catch {
    return { registered: 0 }
  }
}

/** Load owned profile ids and register owner push for this browser. */
export async function registerOwnerPushForCurrentUser(): Promise<{ registered: number }> {
  const token = await waitForAuthToken()
  if (!token) return { registered: 0 }

  const apiRoot = baseUrl.replace(/\/$/, '')
  try {
    const res = await fetch(`${apiRoot}/profiles?limit=100`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { registered: 0 }
    const json: unknown = await res.json()
    const ids = profileIdsFromListResponse(json)
    if (!ids.length) return { registered: 0 }
    return registerOwnerPushForProfiles(ids)
  } catch {
    return { registered: 0 }
  }
}
