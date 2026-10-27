import { NextResponse, type NextRequest } from 'next/server'

/**
 * Workaround while Canva Portal Return URL is still the frontend root
 * (https://app.vbizme.com) instead of the API return handler.
 * Canva lands with ?correlation_jwt=… → forward to API → Card Builder restore.
 */
function canvaCorrelationForward(request: NextRequest): NextResponse | null {
  const jwt = request.nextUrl.searchParams.get('correlation_jwt')
  if (!jwt?.trim()) return null

  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.SERVER_API_URL ||
    'https://api.vbizme.com/api/v1'
  ).replace(/\/$/, '')

  const target = new URL(`${apiBase}/integrations/canva/return`)
  target.searchParams.set('correlation_jwt', jwt.trim())
  return NextResponse.redirect(target)
}

export function middleware(request: NextRequest) {
  const canvaForward = canvaCorrelationForward(request)
  if (canvaForward) return canvaForward

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  const pathname = request.nextUrl.pathname
  const parts = pathname.split('/')
  if (parts[1] === 'vcard') {
    const url = request.nextUrl.clone()
    parts[1] = 'vCard'
    url.pathname = parts.join('/') || '/vCard'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
