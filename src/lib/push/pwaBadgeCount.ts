const KEY = 'vbiz_pwa_badge_count'
export const PWA_BADGE_EVENT = 'vbiz_pwa_badge'

export function readPwaBadgeCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const n = Number(localStorage.getItem(KEY) || '0')
    return Number.isFinite(n) && n > 0 ? Math.min(99, Math.floor(n)) : 0
  } catch {
    return 0
  }
}

export function writePwaBadgeCount(count: number) {
  if (typeof window === 'undefined') return
  const next = Math.max(0, Math.min(99, Math.floor(count)))
  try {
    if (next <= 0) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(next))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(PWA_BADGE_EVENT, { detail: { count: next } }))

  const badgeNav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
  try {
    if (next > 0 && typeof badgeNav.setAppBadge === 'function') void badgeNav.setAppBadge(next)
    else if (typeof badgeNav.clearAppBadge === 'function') void badgeNav.clearAppBadge()
  } catch {
    /* unsupported */
  }
}

export function incrementPwaBadgeCount(by = 1) {
  writePwaBadgeCount(readPwaBadgeCount() + Math.max(1, by))
}

export function clearPwaBadgeCount() {
  writePwaBadgeCount(0)
}

export function subscribePwaBadgeCount(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined
  const handler = () => onStoreChange()
  window.addEventListener(PWA_BADGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(PWA_BADGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function getPwaBadgeCountSnapshot() {
  return readPwaBadgeCount()
}

export function getServerPwaBadgeCountSnapshot() {
  return 0
}
