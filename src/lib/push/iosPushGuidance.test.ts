import {
  isAndroidDevice,
  isDesktopSafari,
  isIosDevice,
  shouldShowAndroidHomeScreenBackupGuide,
  shouldShowIosHomeScreenPushGuide,
} from '@/lib/push/iosPushGuidance'
import { afterEach, describe, expect, it, vi } from 'vitest'

function stubWindowNavigator(ua: string, extras: { platform?: string; maxTouchPoints?: number } = {}) {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, get: () => ua })
  Object.defineProperty(window.navigator, 'platform', {
    configurable: true,
    get: () => extras.platform ?? 'Win32',
  })
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    configurable: true,
    get: () => extras.maxTouchPoints ?? 0,
  })
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
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('iOS / Android / Mac push guidance', () => {
  it('requires Home Screen on iPhone Safari tabs', () => {
    stubWindowNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    )
    expect(isIosDevice()).toBe(true)
    expect(shouldShowIosHomeScreenPushGuide()).toBe(true)
    expect(isDesktopSafari()).toBe(false)
  })

  it('offers Allow plus optional Home Screen backup on Android Chrome', () => {
    stubWindowNavigator(
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    )
    expect(isAndroidDevice()).toBe(true)
    expect(shouldShowIosHomeScreenPushGuide()).toBe(false)
    expect(shouldShowAndroidHomeScreenBackupGuide()).toBe(true)
  })

  it('treats Mac Safari as desktop Safari, not iPhone', () => {
    stubWindowNavigator(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      { platform: 'MacIntel' }
    )
    expect(isIosDevice()).toBe(false)
    expect(isDesktopSafari()).toBe(true)
    expect(shouldShowIosHomeScreenPushGuide()).toBe(false)
  })
})
