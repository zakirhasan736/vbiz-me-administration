import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { resolvePwaAvatarUrl, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ slug: string }>
}

const ALLOWED_HOST_SUFFIXES = ['app.vbizme.com', 'vbizme.com', 'amazonaws.com', 'cloudinary.com', 'nextcreavo.com']

export const runtime = 'nodejs'

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

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'VC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

async function avatarDataUrl(avatarUrl: string, origin: string): Promise<string | null> {
  const fetchUrl = resolveFetchUrl(avatarUrl, origin)
  if (!fetchUrl) return null
  try {
    const response = await fetch(fetchUrl, {
      headers: { Accept: 'image/*,*/*' },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    return `data:${contentType.split(';')[0]};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

function pngIcon(size: number, photoSrc: string | null, initials: string) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        overflow: 'hidden',
      }}
    >
      {photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoSrc} width={size} height={size} style={{ objectFit: 'cover' }} alt="" />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'white',
            fontSize: Math.round(size * 0.38),
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          {initials}
        </div>
      )}
    </div>,
    {
      width: size,
      height: size,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    }
  )
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug: rawSlug } = await context.params
  const slug = rawSlug?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  const size = request.nextUrl.searchParams.get('size') === '512' ? 512 : 192
  const card = await fetchMyCardBySlug(slug)
  const name = card ? resolvePwaDisplayName(card.profile?.name, slug) : slug
  const avatarUrl = card ? resolvePwaAvatarUrl(card) : null

  try {
    const photoSrc = avatarUrl ? await avatarDataUrl(avatarUrl, request.nextUrl.origin) : null
    return pngIcon(size, photoSrc, initialsFromName(name))
  } catch {
    return pngIcon(size, null, initialsFromName(name))
  }
}
