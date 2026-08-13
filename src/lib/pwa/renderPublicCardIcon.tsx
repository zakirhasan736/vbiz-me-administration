import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { resolvePwaAvatarUrl, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import { createSolidPng } from '@/lib/pwa/solidPng'
import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'

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

function pngResponse(buffer: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}

function solidFallback(size: number) {
  return pngResponse(createSolidPng(size))
}

export async function renderPublicCardPwaIcon(slug: string, size: 192 | 512, origin: string): Promise<Response> {
  const card = await fetchMyCardBySlug(slug)
  const name = card ? resolvePwaDisplayName(card.profile?.name, slug) : slug
  const avatarUrl = card ? resolvePwaAvatarUrl(card) : null
  const initials = initialsFromName(name)

  try {
    const photoSrc = avatarUrl ? await avatarDataUrl(avatarUrl, origin) : null
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
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      }
    )
  } catch {
    return solidFallback(size)
  }
}
