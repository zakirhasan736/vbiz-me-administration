import { isStaffRole } from '@/constants/userRole'
import { homePathForOwnerMode, ownerOfficeRedirectPath, type OwnerMode } from '@/lib/packageOwnerMode'
import { isPublicCardMetaPath, isPublicCardPagePath } from '@/lib/pwa/publicCardCachePolicy'

export const SESSION_EXPIRED_LOGIN_PATH = '/login?reason=session-expired'
export const SESSION_EXPIRED_STORAGE_KEY = 'vbiz.session-expired'
export const SESSION_EXPIRING_EVENT = 'vbiz:session-expiring'
export const SESSION_WARNING_SECONDS = 45
export const SESSION_RECENT_ACTIVITY_MS = 60_000

export type SessionExpiryReason = 'idle' | 'expired' | 'unauthorized'

export type SessionHomeInput = {
  role?: string | null
  ownerMode?: OwnerMode | null
}

const AUTH_PAGE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/set-password',
  '/verify-email',
] as const

const WORKSPACE_PATH_PREFIXES = [
  '/admin',
  '/vcards',
  '/teamvcard',
  '/settings',
  '/billing',
  '/dashboard',
  '/team',
] as const

export function shouldSilentlyRefreshSession(role?: string | null): boolean {
  return !isStaffRole(role)
}

/**
 * Session expiry UI + forced login redirect belong only on private backoffice routes
 * (admin, single-card owner, corporate). Public card routes (`/v/...`) must stay undisturbed.
 */
export function isAuthenticatedWorkspacePath(pathname?: string | null): boolean {
  const path = String(pathname ?? '').split(/[?#]/)[0] || '/'
  if (path === '/v' || path.startsWith('/v/') || isPublicCardPagePath(path) || isPublicCardMetaPath(path)) {
    return false
  }
  if (AUTH_PAGE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return false
  }
  if (path === '/') return true
  return WORKSPACE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function currentPathname(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname || '/'
}

function toSession(session: SessionHomeInput | string | null | undefined): SessionHomeInput {
  if (typeof session === 'string' || session == null) return { role: session }
  return session
}

export function homePathForRole(role?: string | null): string {
  return homePathForSession({ role })
}

export function homePathForSession(session: SessionHomeInput): string {
  if (isStaffRole(session.role)) return '/admin/dashboard'
  if (session.ownerMode === 'corporate' || session.ownerMode === 'single') {
    return homePathForOwnerMode(session.ownerMode)
  }
  if (session.role === 'corporate-owner') return '/teamvcard'
  return '/'
}

export function jwtExpiresAt(token: string | null | undefined): number | null {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    if (!payload || typeof atob !== 'function') return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    const parsed = JSON.parse(decoded) as { exp?: unknown }
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null
  } catch {
    return null
  }
}

/** Client-side expiry check used only to schedule or guard session renewal. */
export function isJwtExpired(token: string | null | undefined, now = Date.now()): boolean {
  const expiresAt = jwtExpiresAt(token)
  return expiresAt === null || expiresAt <= now
}

export function requestSessionExpiryWarning(reason: SessionExpiryReason = 'unauthorized'): void {
  if (typeof window === 'undefined') return
  if (!isAuthenticatedWorkspacePath(currentPathname())) return
  window.dispatchEvent(new CustomEvent<SessionExpiryReason>(SESSION_EXPIRING_EVENT, { detail: reason }))
}

export function markSessionExpired(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, '1')
  } catch {
    // Continue with the redirect if session storage is unavailable.
  }
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  const pathname = currentPathname()
  if (pathname.startsWith('/login')) return
  // Never yank visitors off a public card when a stale auth cookie/token expires.
  if (!isAuthenticatedWorkspacePath(pathname)) return
  markSessionExpired()
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

export function redirectToRoleHome(session?: SessionHomeInput | string | null): void {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/login')) return
  window.location.replace(homePathForSession(toSession(session)))
}

export function resolvePostLoginPath(
  session: SessionHomeInput | string | null | undefined,
  requestedPath?: string | null
): string {
  const resolved = toSession(session)
  const fallback = homePathForSession(resolved)
  const requested = requestedPath?.trim()

  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || requested.startsWith('/login')) {
    return fallback
  }

  // A card-owner session must never be sent into the staff console by a stale redirect cookie.
  if (requested.startsWith('/admin') && !isStaffRole(resolved.role)) return fallback
  if (
    !shouldSilentlyRefreshSession(resolved.role) &&
    !requested.startsWith('/admin') &&
    !requested.startsWith('/vcards/edit')
  ) {
    return fallback
  }

  if (!isStaffRole(resolved.role)) {
    const bounced = ownerOfficeRedirectPath({
      pathname: requested,
      role: resolved.role,
      ownerMode:
        resolved.ownerMode === 'corporate' || resolved.ownerMode === 'single'
          ? resolved.ownerMode
          : resolved.role === 'corporate-owner'
            ? 'corporate'
            : 'single',
    })
    if (bounced) return bounced
  }

  return requested
}
