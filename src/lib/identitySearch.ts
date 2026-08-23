export const MIN_IDENTITY_SEARCH_CHARACTERS = 3

export function normalizedSearchQuery(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

export function isIdentitySearchReady(value: string): boolean {
  return normalizedSearchQuery(value).length >= MIN_IDENTITY_SEARCH_CHARACTERS
}

/** Every query token must occur somewhere in the searchable identity fields. */
export function matchesIdentitySearch(query: string, values: Array<unknown>): boolean {
  const normalized = normalizedSearchQuery(query)
  if (!normalized) return true
  if (normalized.length < MIN_IDENTITY_SEARCH_CHARACTERS) return false

  const haystack = values
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .map((value) => String(value).toLocaleLowerCase())
    .join(' ')

  return normalized.split(' ').every((token) => haystack.includes(token))
}
