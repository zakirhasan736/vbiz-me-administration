import { isStaffRole } from '@/constants/userRole'

export const SESSION_EXPIRED_LOGIN_PATH = '/login?reason=session-expired'
export const SESSION_EXPIRED_STORAGE_KEY = 'vbiz.session-expired'

export function shouldSilentlyRefreshSession(role?: string | null): boolean {
  return !isStaffRole(role)
}

export function homePathForRole(role?: string | null): string {
  if (isStaffRole(role)) return '/admin/dashboard'
  if (role === 'corporate-owner') return '/teamvcard'
  return '/'
}

/** Client-side expiry check used only to avoid refreshing staff sessions. */
export function isJwtExpired(token: string | null | undefined, now = Date.now()): boolean {
  if (!token) return true

  try {
    const payload = token.split('.')[1]
    if (!payload || typeof atob !== 'function') return true

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    const parsed = JSON.parse(decoded) as { exp?: unknown }
    return typeof parsed.exp !== 'number' || parsed.exp * 1000 <= now
  } catch {
    return true
  }
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/login')) return
  try {
    window.sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, '1')
  } catch {
    // Continue with the redirect if session storage is unavailable.
  }
  window.location.replace(SESSION_EXPIRED_LOGIN_PATH)
}

export function loginPathForAuthState(): string {
  try {
    return window.sessionStorage.getItem(SESSION_EXPIRED_STORAGE_KEY) === '1' ? SESSION_EXPIRED_LOGIN_PATH : '/login'
  } catch {
    return '/login'
  }
}

export function clearSessionExpiredMarker(): void {
  try {
    window.sessionStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY)
  } catch {
    // Ignore unavailable session storage.
  }
}

export function redirectToRoleHome(role?: string | null): void {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/login')) return
  window.location.replace(homePathForRole(role))
}

export function resolvePostLoginPath(role: string | null | undefined, requestedPath?: string | null): string {
  const fallback = homePathForRole(role)
  const requested = requestedPath?.trim()

  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || requested.startsWith('/login')) {
    return fallback
  }

  // A card-owner session must never be sent into the staff console by a stale redirect cookie.
  if (requested.startsWith('/admin') && !isStaffRole(role)) return fallback
  if (!shouldSilentlyRefreshSession(role) && !requested.startsWith('/admin') && !requested.startsWith('/vcards/edit')) {
    return fallback
  }

  return requested
}
