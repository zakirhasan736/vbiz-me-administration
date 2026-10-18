/**
 * Public card tab deep-links: `/vCard/{slug}#services`
 * Hash uses the stable nav item id (not the display label) so shares stay reliable.
 */

export function encodePublicCardTabHash(tabId: string): string {
  const id = tabId.trim().toLowerCase().replace(/^#+/, '')
  if (!id) return ''
  // Allow nav ids like `insurance-license`, `see-product`, custom tabs.
  const safe = id.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return safe ? `#${safe}` : ''
}

/** Parse `#services` / `#Services` / `#insurance-license` into a nav tab id. */
export function parsePublicCardTabHash(hash: string | null | undefined): string | null {
  if (!hash) return null
  const raw = hash.trim()
  if (!raw || raw === '#') return null
  const id = raw.replace(/^#/, '').trim().toLowerCase()
  if (!id) return null
  return id.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || null
}

export function withPublicCardTabHash(pathOrUrl: string, tabId: string): string {
  const hash = encodePublicCardTabHash(tabId)
  if (!hash) return pathOrUrl
  const base = pathOrUrl.split('#')[0] || pathOrUrl
  return `${base}${hash}`
}

/** Match a hash id against visible tabs (exact id, or label slug). */
export function resolveTabIdFromHash(
  hashId: string,
  tabs: Array<{ id: string; label?: string; displayLabel?: string }>
): string | null {
  const needle = hashId.trim().toLowerCase()
  if (!needle) return null
  const byId = tabs.find((t) => t.id.toLowerCase() === needle)
  if (byId) return byId.id
  const slug = (value?: string) =>
    (value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  const byLabel = tabs.find((t) => slug(t.displayLabel) === needle || slug(t.label) === needle)
  return byLabel?.id ?? null
}
