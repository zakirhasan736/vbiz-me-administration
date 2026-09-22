import { describe, expect, it } from 'vitest'

import { parseSentryDsn, reportSentryEvent } from '@/lib/sentry/report'

describe('parseSentryDsn', () => {
  it('accepts a Sentry DSN and builds the store URL', () => {
    expect(parseSentryDsn('https://public-key@o123.ingest.sentry.io/456')).toEqual({
      key: 'public-key',
      storeUrl: 'https://o123.ingest.sentry.io/api/456/store/',
    })
  })

  it('rejects empty, malformed, and keyless values', () => {
    expect(parseSentryDsn('')).toBeNull()
    expect(parseSentryDsn(undefined)).toBeNull()
    expect(parseSentryDsn('not a url')).toBeNull()
    expect(parseSentryDsn('https://o123.ingest.sentry.io/456')).toBeNull()
    expect(parseSentryDsn('https://public-key@o123.ingest.sentry.io/not-a-project')).toBeNull()
  })
})

describe('reportSentryEvent', () => {
  it('does nothing when no DSN is configured', async () => {
    let called = false
    const sent = await reportSentryEvent({
      dsn: '',
      message: 'ignored',
      fetchImpl: async () => {
        called = true
        return new Response(null, { status: 200 })
      },
    })
    expect(sent).toBe(false)
    expect(called).toBe(false)
  })

  it('posts a browser error when a DSN is set', async () => {
    const captured: { url: string; auth: string; body: { message: string; tags: { app: string } } | null } = {
      url: '',
      auth: '',
      body: null,
    }
    const sent = await reportSentryEvent({
      dsn: 'https://public-key@o123.ingest.sentry.io/456',
      message: "Can't find variable: Notification",
      extra: { project: 'iphone' },
      fetchImpl: async (url, init) => {
        captured.url = String(url)
        captured.auth = String(new Headers(init?.headers).get('X-Sentry-Auth'))
        captured.body = JSON.parse(String(init?.body)) as { message: string; tags: { app: string } }
        return new Response(null, { status: 200 })
      },
    })
    expect(sent).toBe(true)
    expect(captured.url).toBe('https://o123.ingest.sentry.io/api/456/store/')
    expect(captured.auth).toContain('sentry_key=public-key')
    expect(captured.body?.message).toContain('Notification')
    expect(captured.body?.tags.app).toBe('vbiz-me-administration')
  })

  it('swallows a failed delivery', async () => {
    const sent = await reportSentryEvent({
      dsn: 'https://public-key@o123.ingest.sentry.io/456',
      message: 'network down',
      fetchImpl: async () => {
        throw new Error('offline')
      },
    })
    expect(sent).toBe(false)
  })
})
