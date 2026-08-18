import { beforeEach, describe, expect, it, vi } from 'vitest'
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
      getState: () => ({ user: { user: { role }, token: 'expired-access-token' } }),
      dispatch: (action: unknown) => dispatched.push(action),
    },
    dispatched,
  }
}

describe('authenticated API session handling', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/login')
  })

  it('refreshes an owner token once and retries the failed request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
      .mockResolvedValueOnce(response({ success: true, data: { accessToken: 'owner-access-token' } }, 200))
      .mockResolvedValueOnce(response({ success: true, data: { ok: true } }, 200))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('vcard-owner')
    window.history.replaceState({}, '', '/dashboard')

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ data: { success: true, data: { ok: true } } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(requestUrl(fetchMock.mock.calls[1][0])).toContain('/auth/refresh-token')
    expect(requestUrl(fetchMock.mock.calls[2][0])).toContain('/protected')
    expect(dispatched).toHaveLength(1)
  })

  it('does not refresh a staff token and clears the session instead', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ message: 'Access token expired' }, 401))
      .mockResolvedValueOnce(response({ success: true, data: null }, 200))
    vi.stubGlobal('fetch', fetchMock)
    const { context, dispatched } = apiContext('admin')

    const result = await baseQueryWithRefreshToken({ url: '/protected' }, context, {})

    expect(result).toMatchObject({ error: { status: 401 } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(requestUrl(fetchMock.mock.calls[1][0])).toContain('/auth/logout')
    expect(fetchMock.mock.calls.some(([input]) => requestUrl(input).includes('/auth/refresh-token'))).toBe(false)
    expect(dispatched).toHaveLength(1)
  })
})
