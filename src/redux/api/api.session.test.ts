import { SESSION_EXPIRED_LOGIN_PATH } from '@/lib/auth/sessionPolicy'
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

  it('redirects to login when refresh token is no longer valid', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
      .mockResolvedValueOnce(response({ message: 'Refresh token expired' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('vcard-owner')
    const replace = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, replace },
    })
    window.history.replaceState({}, '', '/teamvcard')

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ error: { status: 401 } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(requestUrl(fetchMock.mock.calls[1][0])).toContain('/auth/refresh-token')
    expect(dispatched).toHaveLength(0)
    expect(replace).toHaveBeenCalledWith(SESSION_EXPIRED_LOGIN_PATH)
  })

  it('does not redirect on public card routes', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('admin')
    const replace = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, pathname: '/vCard/acme-card', replace },
    })

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ error: { status: 401 } })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(dispatched).toHaveLength(0)
    expect(replace).not.toHaveBeenCalled()
  })
})
