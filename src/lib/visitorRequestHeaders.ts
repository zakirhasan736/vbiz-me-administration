import type { NextRequest } from 'next/server'

/** Headers we set on server→API calls so Express sees the real browser, not the Next hop. */
export const VBIZ_CLIENT_IP_HEADER = 'x-vbiz-client-ip'
export const VBIZ_CLIENT_UA_HEADER = 'x-vbiz-client-ua'
export const VBIZ_CF_CITY_HEADER = 'x-vbiz-cf-city'
export const VBIZ_CF_COUNTRY_HEADER = 'x-vbiz-cf-country'

function firstForwardedIp(value: string | null): string {
  if (!value) return ''
  return value.split(',')[0]?.trim() || ''
}

export function clientIpFromRequest(request: NextRequest): string {
  return (
    firstForwardedIp(request.headers.get('cf-connecting-ip')) ||
    firstForwardedIp(request.headers.get('x-real-ip')) ||
    firstForwardedIp(request.headers.get('x-forwarded-for')) ||
    ''
  )
}

/** Meta fragment derived only from the inbound browser request (no client JS required). */
export function visitorMetaFromRequest(request: NextRequest, extra?: Record<string, unknown>): Record<string, unknown> {
  const userAgent = request.headers.get('user-agent') || ''
  const language = (request.headers.get('accept-language') || '').split(',')[0]?.trim() || ''
  const referrer = request.headers.get('referer') || request.headers.get('referrer') || ''
  return {
    ...extra,
    userAgent: userAgent || null,
    language: language || null,
    referrer: referrer || null,
    ip: clientIpFromRequest(request) || null,
    cfCity: request.headers.get('cf-ipcity') || request.headers.get('x-vercel-ip-city') || null,
    cfCountry: request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || null,
  }
}

/** Forward the browser identity when Next proxies to the public API over loopback. */
export function visitorForwardHeaders(request: NextRequest): HeadersInit {
  const ua = request.headers.get('user-agent') || ''
  const ip = clientIpFromRequest(request)
  const headers: Record<string, string> = {}
  if (ua) {
    headers['User-Agent'] = ua
    headers[VBIZ_CLIENT_UA_HEADER] = ua
  }
  if (ip) {
    headers['X-Forwarded-For'] = ip
    headers[VBIZ_CLIENT_IP_HEADER] = ip
  }
  const city = request.headers.get('cf-ipcity') || request.headers.get('x-vercel-ip-city')
  const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country')
  if (city) headers[VBIZ_CF_CITY_HEADER] = city
  if (country) headers[VBIZ_CF_COUNTRY_HEADER] = country
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) headers['Accept-Language'] = acceptLanguage
  return headers
}
