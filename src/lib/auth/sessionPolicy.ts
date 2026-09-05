import { isStaffRole } from '@/constants/userRole'
import { homePathForOwnerMode, ownerOfficeRedirectPath, type OwnerMode } from '@/lib/packageOwnerMode'
import { isPublicCardMetaPath, isPublicCardPagePath } from '@/lib/profileRoutes'

export const SESSION_EXPIRED_LOGIN_PATH = '/login'
export const SESSION_EXPIRED_STORAGE_KEY = 'vbiz.session-expired'
/** @deprecated Session expiry popups removed — event kept for backwards-compatible tests. */
export const SESSION_EXPIRING_EVENT = 'vbiz:session-expiring'
export const SESSION_FLUSH_DRAFT_EVENT = 'vbiz:flush-draft'
/** Access + refresh tokens live for 24 hours. */
export const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000
/** Refresh the access token this far before JWT expiry. */
export const SESSION_RENEW_BEFORE_EXPIRY_MS = 5 * 60 * 1000

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
  '/crm',
] as const

/** Access tokens may be rotated for every signed-in workspace role while the user is active. */
export function shouldSilentlyRefreshSession(_role?: string | null): boolean {
  return true
}

/**
 * Session expiry UI + forced login redirect belong only on private backoffice routes
 * (admin, single-card owner, corporate). Public card routes (`/vCard/...`) must stay undisturbed.
 */
export function isAuthenticatedWorkspacePath(pathname?: string | null): boolean {
  const path = String(pathname ?? '').split(/[?#]/)[0] || '/'
  if (isPublicCardPagePath(path) || isPublicCardMetaPath(path)) {
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

export function requestSessionExpiryWarning(_reason: SessionExpiryReason = 'unauthorized'): void {
  // Session expiry popups and idle logout were removed. Token refresh is handled silently.
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
  rememberPostLoginPath(pathname + (typeof window !== 'undefined' ? window.location.search : ''))
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

const REDIRECT_AFTER_LOGIN_COOKIE = 'redirect_after_login'

/** Persist a safe in-app path so login can continue to the originally requested area (e.g. /crm). */
export function rememberPostLoginPath(path?: string | null): void {
  if (typeof window === 'undefined') return
  const cleaned = sanitizePostLoginPath(path)
  if (!cleaned) return
  try {
    const maxAge = 60 * 30
    document.cookie = `${REDIRECT_AFTER_LOGIN_COOKIE}=${encodeURIComponent(cleaned)}; path=/; max-age=${maxAge}; SameSite=Lax`
  } catch {
    // Ignore unavailable cookies.
  }
}

export function consumePostLoginPath(): string | null {
  if (typeof window === 'undefined') return null
  const fromQuery = sanitizePostLoginPath(
    new URLSearchParams(window.location.search).get('redirect') ||
      new URLSearchParams(window.location.search).get('next')
  )
  let fromCookie: string | null = null
  try {
    const match = document.cookie.match(/(?:^|; )redirect_after_login=([^;]*)/)
    if (match?.[1]) fromCookie = sanitizePostLoginPath(decodeURIComponent(match[1]))
  } catch {
    fromCookie = null
  }
  try {
    document.cookie = `${REDIRECT_AFTER_LOGIN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  } catch {
    // Ignore unavailable cookies.
  }
  return fromQuery || fromCookie
}

function sanitizePostLoginPath(path?: string | null): string | null {
  const requested = path?.trim()
  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || requested.startsWith('/login')) {
    return null
  }
  return requested
}

/** Already signed-in on /login — honor deep-link cookie/query, else role home. */
export function redirectToRoleHome(session?: SessionHomeInput | string | null): void {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/login')) return
  const target = resolvePostLoginPath(toSession(session), consumePostLoginPath())
  window.location.replace(target)
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
    isStaffRole(resolved.role) &&
    !requested.startsWith('/admin') &&
    !requested.startsWith('/vcards/edit') &&
    !requested.startsWith('/crm')
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
