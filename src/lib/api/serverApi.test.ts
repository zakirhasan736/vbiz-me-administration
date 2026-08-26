import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('serverApi origin', () => {
  const originalServer = process.env.SERVER_API_URL
  const originalPublic = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env.SERVER_API_URL = originalServer
    process.env.NEXT_PUBLIC_API_URL = originalPublic
  })

  it('prefers SERVER_API_URL and appends /public', async () => {
    process.env.SERVER_API_URL = 'http://127.0.0.1:5000/api/v1/'
    process.env.NEXT_PUBLIC_API_URL = 'https://api.vbizme.com/api/v1'
    const { getApiBaseUrl, getServerApiOrigin } = await import('./serverApi')
    expect(getServerApiOrigin()).toBe('http://127.0.0.1:5000/api/v1')
    expect(getApiBaseUrl()).toBe('http://127.0.0.1:5000/api/v1/public')
  })

  it('falls back to NEXT_PUBLIC_API_URL', async () => {
    delete process.env.SERVER_API_URL
    process.env.NEXT_PUBLIC_API_URL = 'https://api.vbizme.com/api/v1'
    const { getApiBaseUrl } = await import('./serverApi')
    expect(getApiBaseUrl()).toBe('https://api.vbizme.com/api/v1/public')
  })

  it('retries a 429 once then returns the second response', async () => {
    delete process.env.SERVER_API_URL
    process.env.NEXT_PUBLIC_API_URL = 'https://api.vbizme.com/api/v1'
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }))
    const { fetchPublicCardResponseWithOneRetry } = await import('./serverApi')
    const res = await fetchPublicCardResponseWithOneRetry('https://api.vbizme.com/api/v1/public/v/x')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })
})
