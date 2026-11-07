/**
 * Server-only last-known-good copy of each public card's bootstrap payload.
 *
 * Used ONLY when the live API call fails (rate limit, timeout, network). Serving a recent copy
 * of the card is far better for search engines than the empty client-side shell, which has no
 * canonical, no JSON-LD and no visible content. A definite 404 never uses this fallback.
 */

/** How long a copy may be served after the API stops answering. */
export const PUBLIC_CARD_FALLBACK_MAX_AGE_MS = 24 * 60 * 60 * 1000
/** Bound memory per Node process; Map insertion order makes the first key the oldest. */
export const PUBLIC_CARD_FALLBACK_MAX_ENTRIES = 2000

type Entry<T> = { storedAt: number; value: T }

const store = new Map<string, Entry<unknown>>()

function keyFor(slug: string): string {
  return slug.trim().toLowerCase()
}

export function rememberPublicCardBootstrap<T>(slug: string, value: T, now = Date.now()): void {
  const key = keyFor(slug)
  if (!key) return
  store.delete(key)
  store.set(key, { storedAt: now, value })
  while (store.size > PUBLIC_CARD_FALLBACK_MAX_ENTRIES) {
    const oldest = store.keys().next().value
    if (oldest === undefined) break
    store.delete(oldest)
  }
}

export function recallPublicCardBootstrap<T>(slug: string, now = Date.now()): T | null {
  const key = keyFor(slug)
  const entry = store.get(key)
  if (!entry) return null
  if (now - entry.storedAt > PUBLIC_CARD_FALLBACK_MAX_AGE_MS) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

/** A real "card does not exist" — the fallback must be dropped, not served. */
export function forgetPublicCardBootstrap(slug: string): void {
  store.delete(keyFor(slug))
}

/** Test helper. */
export function clearPublicCardBootstrapFallback(): void {
  store.clear()
}
