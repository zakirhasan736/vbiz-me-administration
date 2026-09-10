/** iPhone/iPad Web Push only works from a Home Screen PWA (iOS 16.4+). */

const IOS_PUSH_INTENT_PREFIX = 'vbiz_ios_push_intent_'

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOS || iPadOs
}

/** Chrome on iPhone/iPad (CriOS) — can often show Allow; Home Screen still required for push. */
export function isIosChrome(): boolean {
  if (typeof window === 'undefined' || !isIosDevice()) return false
  return /CriOS/i.test(window.navigator.userAgent)
}

export function isIosSafari(): boolean {
  if (typeof window === 'undefined' || !isIosDevice()) return false
  const ua = window.navigator.userAgent
  // Safari iOS has "Safari" but not CriOS/FxiOS/EdgiOS
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android/i.test(window.navigator.userAgent)
}

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

/**
 * Show Add to Home Screen push guide on iPhone/iPad browser tabs only.
 * Covers Safari and Chrome (CriOS) — both need Home Screen for real push.
 * Android uses Allow in Chrome; see shouldShowAndroidHomeScreenBackupGuide.
 */
export function shouldShowIosHomeScreenPushGuide(): boolean {
  return isIosDevice() && !isPwaStandalone() && !isAndroidDevice()
}

/** Optional Android backup: Allow works in Chrome; Home Screen still recommended. */
export function shouldShowAndroidHomeScreenBackupGuide(): boolean {
  return isAndroidDevice() && !isPwaStandalone()
}

/** @deprecated Prefer shouldShowIosHomeScreenPushGuide */
export function needsIosHomeScreenForPush(): boolean {
  return shouldShowIosHomeScreenPushGuide()
}

/** True when this browser can show the system Allow / Don’t Allow dialog. */
export function canShowBrowserNotificationPrompt(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * iOS Safari/Chrome tabs often lack PushManager until installed.
 * Still treat the device as “push-capable” so we can show the install guide.
 */
export function canOfferPushExperience(): boolean {
  if (typeof window === 'undefined') return false
  if (isAndroidDevice()) {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) return true
  return shouldShowIosHomeScreenPushGuide()
}

export function iosPushIntentKey(cardSlug: string) {
  return `${IOS_PUSH_INTENT_PREFIX}${cardSlug.trim().toLowerCase()}`
}

export function markIosPushIntent(cardSlug: string) {
  const trimmed = cardSlug.trim()
  if (!trimmed || typeof window === 'undefined') return
  try {
    localStorage.setItem(iosPushIntentKey(trimmed), new Date().toISOString())
  } catch {
    /* ignore quota */
  }
}

export function clearIosPushIntent(cardSlug: string) {
  const trimmed = cardSlug.trim()
  if (!trimmed || typeof window === 'undefined') return
  try {
    localStorage.removeItem(iosPushIntentKey(trimmed))
  } catch {
    /* ignore */
  }
}

export function hasIosPushIntent(cardSlug: string): boolean {
  const trimmed = cardSlug.trim()
  if (!trimmed || typeof window === 'undefined') return false
  try {
    return Boolean(localStorage.getItem(iosPushIntentKey(trimmed)))
  } catch {
    return false
  }
}

export const IOS_PUSH_HOME_SCREEN_MESSAGE =
  'On iPhone, add this card to your Home Screen first, open it from that icon, then tap Allow notifications.'

export const IOS_PUSH_AFTER_ALLOW_MESSAGE =
  'Allow saved. Next: Add to Home Screen, open this card from that icon, then Enable again to finish push.'

export const IOS_CHROME_ALLOW_THEN_HOME_MESSAGE =
  'In Chrome on iPhone, tap Allow when asked, then Add to Home Screen and open the icon so push keeps working.'
