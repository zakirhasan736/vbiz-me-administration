/**
 * Public card tab deep-links: `/vCard/{slug}#services`
 * Hash uses the stable nav item id (not the display label) so shares stay reliable.
 * Aliases like `#aboutme` / `#about-me` / `#about_me` also resolve to the About Me tab.
 */

function slugifyTabToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Compare ids/labels without hyphens/underscores (`aboutme` ≡ `about-me` ≡ `about_me`). */
function compactTabToken(value: string): string {
  return slugifyTabToken(value).replace(/[_-]+/g, '')
}

export function encodePublicCardTabHash(tabId: string): string {
  const safe = slugifyTabToken(tabId)
  return safe ? `#${safe}` : ''
}

/** Parse `#services` / `#Services` / `#aboutme` into a normalized hash token. */
export function parsePublicCardTabHash(hash: string | null | undefined): string | null {
  if (!hash) return null
  const raw = hash.trim()
  if (!raw || raw === '#') return null
  return slugifyTabToken(raw) || null
}

export function withPublicCardTabHash(pathOrUrl: string, tabId: string): string {
  const hash = encodePublicCardTabHash(tabId)
  if (!hash) return pathOrUrl
  const base = pathOrUrl.split('#')[0] || pathOrUrl
  return `${base}${hash}`
}

/** Well-known hash aliases → nav tab ids used on the public card. */
const TAB_HASH_ALIASES: Record<string, string> = {
  aboutme: 'about',
  about_me: 'about',
  'about-me': 'about',
  companymission: 'mission',
  missionstatement: 'mission',
  photos: 'gallery',
  portfolio: 'gallery',
  portfolios: 'gallery',
  imagegallery: 'gallery',
  contactus: 'profile',
  contact: 'profile',
  contactinfo: 'profile',
  workexperience: 'work',
  experience: 'work',
  whychooseus: 'who-we-are',
}

/** Match a hash id against visible tabs (exact id, label slug, compact form, or alias). */
export function resolveTabIdFromHash(
  hashId: string,
  tabs: Array<{ id: string; label?: string; displayLabel?: string }>
): string | null {
  const needle = slugifyTabToken(hashId)
  if (!needle || !tabs.length) return null

  const aliasTarget = TAB_HASH_ALIASES[needle] || TAB_HASH_ALIASES[compactTabToken(needle)]
  if (aliasTarget) {
    const aliased = tabs.find((t) => t.id.toLowerCase() === aliasTarget)
    if (aliased) return aliased.id
  }

  const byId = tabs.find((t) => t.id.toLowerCase() === needle)
  if (byId) return byId.id

  const byLabel = tabs.find((t) => {
    const labelSlug = slugifyTabToken(t.displayLabel || '')
    const nameSlug = slugifyTabToken(t.label || '')
    return labelSlug === needle || nameSlug === needle
  })
  if (byLabel) return byLabel.id

  const compactNeedle = compactTabToken(needle)
  const byCompact = tabs.find((t) => {
    if (compactTabToken(t.id) === compactNeedle) return true
    if (compactTabToken(t.displayLabel || '') === compactNeedle) return true
    if (compactTabToken(t.label || '') === compactNeedle) return true
    return false
  })
  return byCompact?.id ?? null
}
