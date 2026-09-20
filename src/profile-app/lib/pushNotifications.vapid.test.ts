import { mapPushSubscribeError, vapidKeyToArrayBuffer } from '@/profile-app/lib/pushNotifications'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('web push VAPID key', () => {
  it('copies the key into a tight ArrayBuffer for Safari subscribe', () => {
    const bytes = new Uint8Array(65)
    bytes[0] = 0x04
    const buffer = vapidKeyToArrayBuffer(bytes)
    expect(buffer.byteLength).toBe(65)
    expect(new Uint8Array(buffer)[0]).toBe(0x04)
  })
})

describe('mapPushSubscribeError', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps iPhone Home Screen guidance instead of a generic fetch error', () => {
    const mapped = mapPushSubscribeError(new Error('On iPhone, add this card to your Home Screen first'))
    expect(mapped.message).toMatch(/Home Screen/i)
  })

  it('explains blocked notification permission', () => {
    const blocked = new Error('Permission denied')
    blocked.name = 'NotAllowedError'
    expect(mapPushSubscribeError(blocked).message).toMatch(/blocked/i)
  })

  it('maps AbortError on iPhone tabs to Home Screen steps', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      get: () =>
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    Object.defineProperty(window.navigator, 'platform', { configurable: true, get: () => 'iPhone' })
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, get: () => 5 })
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    })) as typeof window.matchMedia
    const abort = new Error('Registration failed')
    abort.name = 'AbortError'
    expect(mapPushSubscribeError(abort).message).toMatch(/Home Screen/i)
  })
})
