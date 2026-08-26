import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicCardApiError } from './publicCardApiError'

vi.mock('@/lib/api/serverApi', () => ({
  getApiBaseUrl: () => 'https://api.vbizme.com/api/v1/public',
  PUBLIC_CARD_FETCH_INIT: { cache: 'no-store' },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  }
})

import { fetchMyCardBySlug } from './fetchMyCardBySlug'

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
}

describe('fetchMyCardBySlug', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests /api/v1/public/v/:slug with no-store', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: { profile: { id: 1, slug: 'michaelangelo-casanova-2' } },
      })
    )

    await fetchMyCardBySlug('michaelangelo-casanova-2')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.vbizme.com/api/v1/public/v/michaelangelo-casanova-2')
    expect(init.cache).toBe('no-store')
    expect((init.headers as Record<string, string>).Accept).toBe('application/json')
  })

  it('returns card data on 200', async () => {
    const data = { profile: { id: 9, slug: 'ok' } }
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data }))
    await expect(fetchMyCardBySlug('ok')).resolves.toEqual(data)
  })

  it('returns null on HTTP 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, error: 'Profile not found' }, { status: 404 }))
    await expect(fetchMyCardBySlug('missing')).resolves.toBeNull()
  })

  it('returns null for an empty slug without fetching', async () => {
    await expect(fetchMyCardBySlug('   ')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws RATE_LIMITED on 429 and captures request id', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false }, { status: 429, headers: { 'x-vbiz-request-id': 'req-429' } })
    )
    await expect(fetchMyCardBySlug('busy')).rejects.toMatchObject({
      name: 'PublicCardApiError',
      kind: 'RATE_LIMITED',
      status: 429,
      requestId: 'req-429',
    })
  })

  it.each([500, 502, 503, 504])('throws PUBLIC_CARD_API_ERROR on %s', async (status) => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false }, { status, headers: { 'x-vbiz-request-id': `req-${status}` } })
    )
    await expect(fetchMyCardBySlug('down')).rejects.toMatchObject({
      kind: 'PUBLIC_CARD_API_ERROR',
      status,
      requestId: `req-${status}`,
    })
  })

  it.each([401, 403])('throws CONFIGURATION_ERROR on %s', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false }, { status }))
    await expect(fetchMyCardBySlug('denied')).rejects.toMatchObject({
      kind: 'CONFIGURATION_ERROR',
      status,
    })
  })

  it('throws NETWORK_ERROR when fetch fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await fetchMyCardBySlug('offline').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PublicCardApiError)
    expect(error).toMatchObject({ kind: 'NETWORK_ERROR', status: null })
  })

  it('throws PARSE_ERROR on invalid JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('not-json', { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    await expect(fetchMyCardBySlug('bad-json')).rejects.toMatchObject({ kind: 'PARSE_ERROR', status: 200 })
  })

  it('throws MALFORMED_PAYLOAD when success/data is missing', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }))
    await expect(fetchMyCardBySlug('empty')).rejects.toMatchObject({ kind: 'MALFORMED_PAYLOAD', status: 200 })
  })
})
