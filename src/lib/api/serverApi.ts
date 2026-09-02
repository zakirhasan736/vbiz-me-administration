/** Server-only — do not import from client components. */

function trimSlash(url: string): string {
  return url.replace(/\/$/, '')
}

/**
 * Server-only API origin. Prefer SERVER_API_URL (loopback) so SSR does not
 * exit to the public hostname and share one internet IP rate-limit bucket.
 */
export function getServerApiOrigin(): string {
  const internal = process.env.SERVER_API_URL?.trim()
  if (internal) return trimSlash(internal)
  return trimSlash(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
}

/** Public card API base (`/api/v1/public`). */
export function getApiBaseUrl(): string {
  return `${getServerApiOrigin()}/public`
}

export function usesLoopbackServerApi(): boolean {
  return Boolean(process.env.SERVER_API_URL?.trim())
}

/** Card identity/theme/SEO must never be ISR-cached. */
export const PUBLIC_CARD_FETCH_INIT: RequestInit = {
  cache: 'no-store',
}

export function publicCardServerHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  headers.set('Accept', headers.get('Accept') || 'application/json')
  const internalKey = process.env.INTERNAL_PUBLIC_API_KEY?.trim()
  if (internalKey) headers.set('x-vbiz-internal-key', internalKey)
  return headers
}

function retryAfterMs(response: Response): number {
  const raw = response.headers.get('Retry-After')
  if (!raw) return 250
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.max(seconds * 1000, 50), 1500)
  }
  return 250
}

async function fetchPublicCardResponseOnce(url: string, init?: RequestInit): Promise<Response> {
  const headers = publicCardServerHeaders(init?.headers)
  return fetch(url, {
    ...PUBLIC_CARD_FETCH_INIT,
    ...init,
    headers,
  })
}

/** Server-side public API fetch — at most one 429 retry to avoid error pages on brief spikes. */
export async function fetchPublicCardResponse(url: string, init?: RequestInit): Promise<Response> {
  const first = await fetchPublicCardResponseOnce(url, init)
  if (first.status !== 429) return first
  await new Promise((resolve) => setTimeout(resolve, retryAfterMs(first)))
  return fetchPublicCardResponseOnce(url, init)
}

/** @deprecated use fetchPublicCardResponse (retry is built in). */
export async function fetchPublicCardResponseWithOneRetry(url: string, init?: RequestInit): Promise<Response> {
  return fetchPublicCardResponse(url, init)
}

/** @deprecated public card fetches use PUBLIC_CARD_FETCH_INIT instead. */
export const SERVER_FETCH_REVALIDATE_SECONDS = 0
