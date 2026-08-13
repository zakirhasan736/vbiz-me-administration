import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { resolvePwaAvatarUrl } from '@/lib/pwa/resolvePublicCardPwa'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ slug: string }>
}

const ALLOWED_HOST_SUFFIXES = ['app.vbizme.com', 'vbizme.com', 'amazonaws.com', 'cloudinary.com', 'nextcreavo.com']

function isAllowedAvatarHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

function resolveFetchUrl(avatarUrl: string, origin: string): string | null {
  if (avatarUrl.startsWith('/')) {
    return `${origin.replace(/\/$/, '')}${avatarUrl}`
  }
  try {
    const parsed = new URL(avatarUrl)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    if (!isAllowedAvatarHost(parsed.hostname)) return null
    return parsed.toString()
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug: rawSlug } = await context.params
  const slug = rawSlug?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  const card = await fetchMyCardBySlug(slug)
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  const avatarUrl = resolvePwaAvatarUrl(card)
  if (!avatarUrl) {
    return NextResponse.redirect(new URL('/favicon.ico', request.nextUrl.origin))
  }

  const fetchUrl = resolveFetchUrl(avatarUrl, request.nextUrl.origin)
  if (!fetchUrl) {
    return NextResponse.redirect(new URL('/favicon.ico', request.nextUrl.origin))
  }

  try {
    const response = await fetch(fetchUrl, {
      headers: { Accept: 'image/*,*/*' },
      next: { revalidate: 3600 },
    })
    if (!response.ok) {
      return NextResponse.redirect(new URL('/favicon.ico', request.nextUrl.origin))
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.redirect(new URL('/favicon.ico', request.nextUrl.origin))
    }

    const buffer = await response.arrayBuffer()
    const size = request.nextUrl.searchParams.get('size') === '512' ? '512x512' : '192x192'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Pwa-Icon-Size': size,
      },
    })
  } catch {
    return NextResponse.redirect(new URL('/favicon.ico', request.nextUrl.origin))
  }
}
