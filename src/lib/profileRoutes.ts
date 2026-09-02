export const DEFAULT_PROFILE_SECTION = 'home'

/** Public card page path segment (domain.com/vCard/{slug}). */
export const PUBLIC_CARD_PATH_SEGMENT = 'vCard'

/** Legacy segment kept for redirects and backward-compatible path checks. */
export const LEGACY_PUBLIC_CARD_PATH_SEGMENT = 'v'

function splitPathname(pathname: string): string[] {
  return String(pathname || '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
}

export function isPublicCardRootSegment(segment: string | undefined): boolean {
  return segment === PUBLIC_CARD_PATH_SEGMENT || segment === LEGACY_PUBLIC_CARD_PATH_SEGMENT
}

/** Public profile path: `/vCard/{slug}`. */
export function buildProfilePath(slug: string): string {
  const trimmedSlug = slug.trim()
  if (!trimmedSlug) return `/${PUBLIC_CARD_PATH_SEGMENT}`
  return `/${PUBLIC_CARD_PATH_SEGMENT}/${encodeURIComponent(trimmedSlug)}`
}

export function buildProfileIconPath(slug: string, size: 192 | 512): string {
  return `${buildProfilePath(slug)}/icon/${size}`
}

export function buildProfileManifestPath(slug: string): string {
  return `${buildProfilePath(slug)}/manifest.webmanifest`
}

export function buildProfileWalletArtPath(slug: string, query = ''): string {
  const base = `${buildProfilePath(slug)}/wallet-art`
  return query ? `${base}?${query.replace(/^\?/, '')}` : base
}

export function isPublicCardPagePath(pathname: string): boolean {
  const parts = splitPathname(pathname)
  if (!isPublicCardRootSegment(parts[0]) || !parts[1]) return false
  if (!parts[2]) return true
  return parts[2] !== 'icon' && parts[2] !== 'manifest.webmanifest' && parts[2] !== 'wallet-art'
}

export function isPublicCardMetaPath(pathname: string): boolean {
  const parts = splitPathname(pathname)
  if (!isPublicCardRootSegment(parts[0]) || !parts[1]) return false
  return parts[2] === 'icon' || parts[2] === 'manifest.webmanifest' || parts[2] === 'wallet-art'
}

export function isPublicCardPath(pathname: string): boolean {
  return isPublicCardPagePath(pathname) || isPublicCardMetaPath(pathname)
}
