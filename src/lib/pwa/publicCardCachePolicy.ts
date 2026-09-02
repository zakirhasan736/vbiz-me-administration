/** Keep service-worker fetch rules and PWA runtime cache warming in sync. */

import {
  isPublicCardMetaPath as isPublicCardMetaRoute,
  isPublicCardPagePath as isPublicCardPageRoute,
  isPublicCardRootSegment,
  PUBLIC_CARD_PATH_SEGMENT,
} from '@/lib/profileRoutes'

export { isPublicCardMetaPath, isPublicCardPagePath } from '@/lib/profileRoutes'

export function isBackofficePath(pathname: string): boolean {
  const path = String(pathname || '').toLowerCase()
  const root = path.replace(/^\/+|\/+$/g, '').split('/')[0]
  if (isPublicCardRootSegment(root)) return false
  if (path.startsWith('/_next/')) return false
  if (path.startsWith('/api/pwa/')) return false
  if (path.includes('/api/v1/public/')) return false
  if (path.startsWith('/api/v1/')) return true
  if (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/set-password') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/vcards') ||
    path.startsWith('/settings') ||
    path.startsWith('/team') ||
    path.startsWith('/billing') ||
    path.startsWith('/crm')
  ) {
    return true
  }
  return false
}

export function isPublicCardDataPath(pathname: string): boolean {
  const path = String(pathname || '').toLowerCase()
  if (path.startsWith('/_next/data/') && (path.includes('/v/') || path.includes('/vcard/'))) return true
  if (path.startsWith('/api/pwa/')) return true
  return (
    path.includes('/api/v1/public/') ||
    path.includes('/public/dynamic-section/') ||
    path.includes('/public/profile-ai-data/') ||
    path.includes('/public/profiles/') ||
    path.includes('/public/post-types') ||
    path.includes('/public/v/') ||
    path.includes('/public/announcement')
  )
}

export function isHashedNextStaticPath(pathname: string): boolean {
  return String(pathname || '').startsWith('/_next/static/')
}

export function publicCardPathPrefix(): string {
  return `/${PUBLIC_CARD_PATH_SEGMENT}/`
}

/** @deprecated Use isPublicCardPagePath from profileRoutes */
export function isLegacyPublicCardPagePath(pathname: string): boolean {
  return isPublicCardPageRoute(pathname)
}

/** @deprecated Use isPublicCardMetaPath from profileRoutes */
export function isLegacyPublicCardMetaPath(pathname: string): boolean {
  return isPublicCardMetaRoute(pathname)
}
