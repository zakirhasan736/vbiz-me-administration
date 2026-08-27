import { SESSION_EXPIRING_EVENT } from '@/lib/auth/sessionPolicy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { baseQueryWithRefreshToken } from './api'

function response(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString()
}

function apiContext(role: string) {
  const dispatched: unknown[] = []
  return {
    context: {
      signal: new AbortController().signal,
      endpoint: 'testEndpoint',
      type: 'query',
      forced: false,
      extra: {},
      getState: () => ({ user: { user: { id: 'user-1', role }, token: 'expired-access-token' } }),
      dispatch: (action: unknown) => dispatched.push(action),
    },
    dispatched,
  }
}

describe('authenticated API session handling', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/admin/dashboard')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refreshes an owner token once and retries the failed request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
      .mockResolvedValueOnce(response({ success: true, data: { accessToken: 'owner-access-token' } }, 200))
      .mockResolvedValueOnce(response({ success: true, data: { ok: true } }, 200))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('vcard-owner')
    window.history.replaceState({}, '', '/')

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ data: { success: true, data: { ok: true } } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(requestUrl(fetchMock.mock.calls[1][0])).toContain('/auth/refresh-token')
    expect(requestUrl(fetchMock.mock.calls[2][0])).toContain('/protected')
    expect(dispatched).toHaveLength(1)
  })

  it('refreshes a staff token once and retries the failed request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
      .mockResolvedValueOnce(response({ success: true, data: { accessToken: 'staff-access-token' } }, 200))
      .mockResolvedValueOnce(response({ success: true, data: { ok: true } }, 200))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('admin')

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ data: { success: true, data: { ok: true } } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(requestUrl(fetchMock.mock.calls[1][0])).toContain('/auth/refresh-token')
    expect(requestUrl(fetchMock.mock.calls[2][0])).toContain('/protected')
    expect(dispatched).toHaveLength(1)
  })

  it('opens the expiry warning when an owner refresh token is no longer valid', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
      .mockResolvedValueOnce(response({ message: 'Refresh token expired' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('vcard-owner')
    const warning = vi.fn()
    window.addEventListener(SESSION_EXPIRING_EVENT, warning)
    window.history.replaceState({}, '', '/teamvcard')

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ error: { status: 401 } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(requestUrl(fetchMock.mock.calls[1][0])).toContain('/auth/refresh-token')
    expect(dispatched).toHaveLength(0)
    expect(warning).toHaveBeenCalledTimes(1)
    window.removeEventListener(SESSION_EXPIRING_EVENT, warning)
  })

  it('does not open the expiry warning on public card routes', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('admin')
    const warning = vi.fn()
    window.addEventListener(SESSION_EXPIRING_EVENT, warning)
    window.history.replaceState({}, '', '/v/acme-card')

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ error: { status: 401 } })
    expect(dispatched).toHaveLength(0)
    expect(warning).not.toHaveBeenCalled()
    window.removeEventListener(SESSION_EXPIRING_EVENT, warning)
  })
})
