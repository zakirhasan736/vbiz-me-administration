import { getCanvaConfig } from '@/lib/canva/config'

export function sanitizeReturnTo(value: string | null | undefined, fallback = '/') {
  if (!value) return fallback

  try {
    const url = new URL(value, 'http://127.0.0.1:3000')
    if (url.pathname.startsWith('/')) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    return fallback
  }

  return fallback
}

export function buildCanvaResultUrl(returnTo: string, status: 'connected' | 'error', message?: string) {
  const { appUrl } = getCanvaConfig()
  const url = new URL(returnTo, appUrl)
  url.searchParams.set('canva', status)
  if (message) {
    url.searchParams.set('canva_error', message)
  }
  return url.pathname + url.search + url.hash
}
