import { getNavItemById } from '@/lib/vcardNavbar'

export const DEFAULT_PROFILE_SECTION = 'home'

export type ParsedProfileRoute = {
  sectionId: string
}

export function parseProfileSegments(segments: string[] | undefined): ParsedProfileRoute {
  const first = segments?.[0]?.trim()
  if (!first) {
    return { sectionId: DEFAULT_PROFILE_SECTION }
  }
  return { sectionId: first }
}

export function isValidProfileSection(sectionId: string): boolean {
  return Boolean(getNavItemById(sectionId))
}

/** Public profile path: `/v/{slug}` for home, `/v/{slug}/{section}` otherwise. */
export function buildProfilePath(slug: string, sectionId?: string): string {
  const trimmedSlug = slug.trim()
  const section = sectionId ?? DEFAULT_PROFILE_SECTION
  if (!trimmedSlug) return '/v'
  if (section === DEFAULT_PROFILE_SECTION) {
    return `/v/${encodeURIComponent(trimmedSlug)}`
  }
  return `/v/${encodeURIComponent(trimmedSlug)}/${encodeURIComponent(section)}`
}

export function buildProfileSectionPath(slug: string, sectionId: string): string {
  return buildProfilePath(slug, sectionId)
}

/** Active section from the browser path (`/v/{slug}` → home). */
export function parseSectionFromPathname(pathname: string, slug: string): string {
  const trimmedSlug = slug.trim()
  if (!trimmedSlug) return DEFAULT_PROFILE_SECTION

  const segments = pathname.split('/').filter(Boolean)
  const vIndex = segments.indexOf('v')
  if (vIndex < 0) return DEFAULT_PROFILE_SECTION

  const pathSlug = segments[vIndex + 1]
  if (!pathSlug || decodeURIComponent(pathSlug) !== trimmedSlug) {
    return DEFAULT_PROFILE_SECTION
  }

  const sectionSegment = segments[vIndex + 2]
  if (!sectionSegment) return DEFAULT_PROFILE_SECTION

  return decodeURIComponent(sectionSegment)
}
