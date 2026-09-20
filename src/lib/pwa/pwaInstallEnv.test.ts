import {
  isAndroidDevice,
  isFirefoxBrowser,
  isInAppBrowser,
  isIosChrome,
  isIosDevice,
  isSafariBrowser,
  resolvePwaInstallSurface,
} from '@/lib/pwa/pwaInstallEnv'
import { describe, expect, it } from 'vitest'

describe('PWA install surface', () => {
  it('sends Instagram/Facebook iPhone traffic to open-in-Safari', () => {
    expect(
      resolvePwaInstallSurface(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram'
      )
    ).toBe('ios-inapp')
    expect(isInAppBrowser('Mozilla/5.0 (iPhone) Instagram 300.0.0')).toBe(true)
  })

  it('detects Safari iPhone vs Chrome iPhone vs Android vs Mac Safari vs Firefox', () => {
    expect(
      resolvePwaInstallSurface(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      )
    ).toBe('ios-safari')
    expect(
      resolvePwaInstallSurface(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'
      )
    ).toBe('ios-chrome')
    expect(isIosChrome('Mozilla/5.0 (iPhone) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1')).toBe(true)
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0')).toBe(false)
    expect(isAndroidDevice('Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0')).toBe(true)
    expect(
      isSafariBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      )
    ).toBe(true)
    expect(isFirefoxBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0')).toBe(
      true
    )
    expect(resolvePwaInstallSurface('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Edg/120.0.0.0')).toBe(
      'chromium'
    )
    expect(
      resolvePwaInstallSurface(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      )
    ).toBe('mac-safari')
  })
})
