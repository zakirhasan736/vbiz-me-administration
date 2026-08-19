/** Keep service-worker fetch rules and PWA runtime cache warming in sync. */

export function isPublicCardPagePath(pathname: string): boolean {
  const parts = String(pathname || '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
  if (parts[0] !== 'v' || !parts[1]) return false
  if (!parts[2]) return true
  return parts[2] !== 'icon' && parts[2] !== 'manifest.webmanifest'
}

export function isPublicCardMetaPath(pathname: string): boolean {
  return pathname.startsWith('/v/') && (pathname.includes('/icon/') || pathname.endsWith('manifest.webmanifest'))
}

export function isBackofficePath(pathname: string): boolean {
  const path = String(pathname || '').toLowerCase()
  if (path.startsWith('/v/')) return false
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
    path.startsWith('/billing')
  ) {
    return true
  }
  return false
}

export function isPublicCardDataPath(pathname: string): boolean {
  const path = String(pathname || '').toLowerCase()
  if (path.startsWith('/_next/data/') && path.includes('/v/')) return true
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
