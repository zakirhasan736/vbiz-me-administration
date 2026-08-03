export const DEFAULT_PROFILE_SECTION = 'home'

/** Public profile path: `/v/{slug}`. */
export function buildProfilePath(slug: string): string {
  const trimmedSlug = slug.trim()
  if (!trimmedSlug) return '/v'
  return `/v/${encodeURIComponent(trimmedSlug)}`
}
