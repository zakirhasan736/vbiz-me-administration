import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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
