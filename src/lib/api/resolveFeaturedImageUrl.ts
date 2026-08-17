/** Node may send a string, `{ url }`, or `[{ url }]` for featured media. */
export function resolveFeaturedImageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = resolveFeaturedImageUrl(entry)
      if (url) return url
    }
    return ''
  }
  if (value && typeof value === 'object') {
    return String((value as { url?: string }).url ?? '').trim()
  }
  return ''
}

export function isPublishedStatus(status: unknown): boolean {
  if (status === undefined || status === null || status === '') return true
  if (status === 1 || status === true) return true
  const normalized = String(status).trim().toLowerCase()
  return normalized === '1' || normalized === 'active' || normalized === 'true' || normalized === 'published'
}
