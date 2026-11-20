import { OWNER_PUSH_OK_KEY, isOwnerPushDevice, unsubscribeFromCard } from '@/profile-app/lib/pushNotifications'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function installFakePush() {
  const unsubscribe = vi.fn().mockResolvedValue(true)
  const subscription = {
    endpoint: 'https://push.example/endpoint-1',
    unsubscribe,
    toJSON: () => ({
      endpoint: 'https://push.example/endpoint-1',
      expirationTime: null,
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    }),
  }
  const registration = {
    active: { state: 'activated' },
    update: vi.fn().mockResolvedValue(undefined),
    pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
  }
  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      controller: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  })
  vi.stubGlobal('PushManager', function PushManager() {})
  vi.stubGlobal(
    'Notification',
    Object.assign(function Notification() {}, { permission: 'granted' })
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  return { unsubscribe }
}

describe('unsubscribeFromCard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it("keeps the browser subscription on a card owner's device so owner alerts keep arriving", async () => {
    const { unsubscribe } = installFakePush()
    localStorage.setItem(OWNER_PUSH_OK_KEY, String(Date.now()))
    expect(isOwnerPushDevice()).toBe(true)

    await unsubscribeFromCard('my-card')

    expect(unsubscribe).not.toHaveBeenCalled()
  })

  it('still fully unsubscribes a visitor browser after its last card follow is turned off', async () => {
    const { unsubscribe } = installFakePush()
    expect(isOwnerPushDevice()).toBe(false)

    await unsubscribeFromCard('some-card')

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
