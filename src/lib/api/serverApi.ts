/** Server-only — do not import from client components. */

function trimSlash(url: string): string {
  return url.replace(/\/$/, '')
}

/** Keep SSR from hanging forever when the API is wedged; network errors retry below. */
const PUBLIC_CARD_FETCH_TIMEOUT_MS = 12_000

/**
 * Server-only API origin. Prefer SERVER_API_URL (loopback) so SSR does not
 * exit to the public hostname and share one internet IP rate-limit bucket.
 */
export function getServerApiOrigin(): string {
  const internal = process.env.SERVER_API_URL?.trim()
  if (internal) return trimSlash(internal)
  return trimSlash(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
}

function getPublicApiOrigin(): string {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Human-readable cause for PM2 logs (ECONNREFUSED, AbortError, etc.). */
export function describeFetchError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const parts = [error.name, error.message]
  const cause = error.cause
  if (cause instanceof Error) {
    parts.push(cause.message)
    const code = (cause as NodeJS.ErrnoException).code
    if (code) parts.push(String(code))
  } else if (cause && typeof cause === 'object' && 'code' in cause) {
    parts.push(String((cause as { code: unknown }).code))
  }
  return parts.filter(Boolean).join(' | ')
}

function withFetchTimeout(init?: RequestInit): RequestInit {
  if (init?.signal) return init
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return { ...init, signal: AbortSignal.timeout(PUBLIC_CARD_FETCH_TIMEOUT_MS) }
  }
  return init ?? {}
}

/** When loopback SSR fails, rewrite to the public API origin once. */
function rewriteToPublicOrigin(url: string): string | null {
  const internal = process.env.SERVER_API_URL?.trim()
  if (!internal) return null
  const from = trimSlash(internal)
  const to = getPublicApiOrigin()
  if (!from || from === to || !url.startsWith(from)) return null
  return `${to}${url.slice(from.length)}`
}

async function fetchPublicCardResponseOnce(url: string, init?: RequestInit): Promise<Response> {
  const headers = publicCardServerHeaders(init?.headers)
  return fetch(url, {
    ...PUBLIC_CARD_FETCH_INIT,
    ...withFetchTimeout(init),
    headers,
  })
}

async function fetchWith429Retry(url: string, init?: RequestInit): Promise<Response> {
  const first = await fetchPublicCardResponseOnce(url, init)
  if (first.status !== 429) return first
  await sleep(retryAfterMs(first))
  return fetchPublicCardResponseOnce(url, init)
}

/**
 * Server-side public API fetch:
 * - one 429 retry
 * - one network retry on the same origin
 * - one fallback to NEXT_PUBLIC_API_URL when SERVER_API_URL loopback fails
 */
export async function fetchPublicCardResponse(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchWith429Retry(url, init)
  } catch (firstError) {
    try {
      await sleep(200)
      return await fetchWith429Retry(url, init)
    } catch (secondError) {
      const fallback = rewriteToPublicOrigin(url)
      if (fallback) {
        try {
          console.warn('[serverApi] loopback public-card fetch failed; retrying via NEXT_PUBLIC_API_URL', {
            cause: describeFetchError(secondError),
            from: getServerApiOrigin(),
            to: getPublicApiOrigin(),
          })
          return await fetchWith429Retry(fallback, init)
        } catch {
          // Prefer the loopback failure message — ops care about SERVER_API_URL health.
        }
      }
      throw secondError instanceof Error ? secondError : firstError
    }
  }
}

/** @deprecated use fetchPublicCardResponse (retry is built in). */
export async function fetchPublicCardResponseWithOneRetry(url: string, init?: RequestInit): Promise<Response> {
  return fetchPublicCardResponse(url, init)
}

/** @deprecated public card fetches use PUBLIC_CARD_FETCH_INIT instead. */
export const SERVER_FETCH_REVALIDATE_SECONDS = 0
