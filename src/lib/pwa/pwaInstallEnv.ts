/** User-agent helpers for Add to Home Screen / PWA install UI. */

export function readUserAgent(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || '') {
  return ua
}

export function isIosDevice(ua = readUserAgent()) {
  if (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true
  }
  return /iPad|iPhone|iPod/.test(ua)
}

export function isAndroidDevice(ua = readUserAgent()) {
  return /Android/i.test(ua)
}

export function isSafariBrowser(ua = readUserAgent()) {
  return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox|OPR|CriOS|FxiOS|EdgiOS/i.test(ua)
}

export function isIosChrome(ua = readUserAgent()) {
  return isIosDevice(ua) && /CriOS/i.test(ua)
}

export function isIosFirefox(ua = readUserAgent()) {
  return isIosDevice(ua) && /FxiOS/i.test(ua)
}

export function isFirefoxBrowser(ua = readUserAgent()) {
  return /Firefox|FxiOS/i.test(ua)
}

export function isEdgeBrowser(ua = readUserAgent()) {
  return /Edg\/|EdgiOS/i.test(ua)
}

/** Instagram, Facebook, WhatsApp, LinkedIn, etc. cannot add a real Home Screen PWA. */
export function isInAppBrowser(ua = readUserAgent()) {
  return /FBAN|FBAV|Instagram|Line\/|WhatsApp|TikTok|Twitter|LinkedInApp|Snapchat|Pinterest|WeChat|MicroMessenger|; wv\)|WebView/i.test(
    ua
  )
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

const HOME_SCREEN_ADDED_KEY = 'vbiz_home_screen_added'
const HOME_SCREEN_AFTER_CONTACT_KEY = 'vbiz_home_screen_after_contact'

export function markCardOnHomeScreen(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HOME_SCREEN_ADDED_KEY, '1')
  } catch {
    /* private mode */
  }
}

/** True once this browser has opened the card from the Home Screen icon, or finished Install. */
export function isCardOnHomeScreen(): boolean {
  if (typeof window === 'undefined') return false
  if (isStandaloneDisplay() || window.__vbizPwa?.installed === true) {
    markCardOnHomeScreen()
    return true
  }
  try {
    return window.localStorage.getItem(HOME_SCREEN_ADDED_KEY) === '1'
  } catch {
    return false
  }
}

export function markHomeScreenPromptAfterContact(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(HOME_SCREEN_AFTER_CONTACT_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function homeScreenPromptAfterContactPending(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(HOME_SCREEN_AFTER_CONTACT_KEY) === '1'
  } catch {
    return false
  }
}

export function clearHomeScreenPromptAfterContact(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(HOME_SCREEN_AFTER_CONTACT_KEY)
  } catch {
    /* private mode */
  }
}

export type PwaInstallSurface =
  'ios-inapp' | 'ios-safari' | 'ios-chrome' | 'ios-other' | 'android' | 'mac-safari' | 'firefox' | 'chromium'

export function resolvePwaInstallSurface(ua = readUserAgent()): PwaInstallSurface {
  if (isIosDevice(ua)) {
    if (isInAppBrowser(ua)) return 'ios-inapp'
    if (isIosChrome(ua)) return 'ios-chrome'
    if (isSafariBrowser(ua)) return 'ios-safari'
    return 'ios-other'
  }
  if (isAndroidDevice(ua)) return 'android'
  if (isSafariBrowser(ua)) return 'mac-safari'
  if (isFirefoxBrowser(ua)) return 'firefox'
  return 'chromium'
}
