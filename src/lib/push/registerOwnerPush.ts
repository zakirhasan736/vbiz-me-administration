import {
  assertValidVapidPublicKey,
  isPushSupported,
  registerServiceWorker,
  resolveVapidPublicKey,
  subscriptionToPayload,
  vapidKeyToArrayBuffer,
} from '@/profile-app/lib/pushNotifications'
import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

type ProfileListRow = { id?: string }

/**
 * Register this browser as an **owner** Web Push device for each owned card.
 * Distinct from public-card follower subscriptions (savers who allow notifications).
 */
export async function registerOwnerPushForProfiles(profileIds: string[]): Promise<{ registered: number }> {
  const ids = [...new Set(profileIds.map((id) => id.trim()).filter(Boolean))]
  if (!ids.length || !isPushSupported()) return { registered: 0 }

  const token = store.getState().user.token
  if (!token) return { registered: 0 }

  try {
    const publicKey = await resolveVapidPublicKey()
    const keyBytes = assertValidVapidPublicKey(publicKey)
    const registration = await registerServiceWorker()
    if (!registration) return { registered: 0 }

    await navigator.serviceWorker.ready.catch(() => null)
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

/** Load owned profile ids (first page) and register owner push. */
export async function registerOwnerPushForCurrentUser(): Promise<{ registered: number }> {
  const token = store.getState().user.token
  if (!token) return { registered: 0 }

  const apiRoot = baseUrl.replace(/\/$/, '')
  try {
    const res = await fetch(`${apiRoot}/profiles?limit=100`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { registered: 0 }
    const json = (await res.json()) as {
      data?: ProfileListRow[] | { items?: ProfileListRow[] }
      items?: ProfileListRow[]
    }
    const rows = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.items)
        ? json.data.items
        : Array.isArray(json.items)
          ? json.items
          : []
    const ids = rows.map((row) => row.id).filter((id): id is string => Boolean(id))
    return registerOwnerPushForProfiles(ids)
  } catch {
    return { registered: 0 }
  }
}
