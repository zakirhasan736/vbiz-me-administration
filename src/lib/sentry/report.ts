export type ParsedSentryDsn = {
  key: string
  storeUrl: string
}

export function parseSentryDsn(raw: string | undefined | null): ParsedSentryDsn | null {
  const value = raw?.trim()
  if (!value) return null

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const key = decodeURIComponent(url.username)
  const projectId = url.pathname.split('/').filter(Boolean)[0] || ''
  if (!key || !/^\d+$/.test(projectId)) return null

  return {
    key,
    storeUrl: `${url.protocol}//${url.host}/api/${projectId}/store/`,
  }
}

function eventId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function reportSentryEvent(input: {
  dsn?: string | null
  message: string
  level?: 'error' | 'warning'
  extra?: Record<string, unknown>
  fetchImpl?: typeof fetch
}): Promise<boolean> {
  const parsed = parseSentryDsn(input.dsn)
  if (!parsed) return false

  const fetchImpl = input.fetchImpl || fetch
  try {
    const response = await fetchImpl(parsed.storeUrl, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=vbiz-admin/1.0, sentry_key=${parsed.key}`,
      },
      body: JSON.stringify({
        event_id: eventId(),
        message: input.message.slice(0, 2000),
        level: input.level || 'error',
        platform: 'javascript',
        timestamp: Date.now() / 1000,
        tags: { app: 'vbiz-me-administration' },
        extra: input.extra || {},
      }),
    })
    return response.ok
  } catch {
    return false
  }
}
