import { PublicCardApiError } from '@/lib/api/myCard/publicCardApiError'
import { fetchCardForPublicIcon } from '@/lib/pwa/fetchCardForPublicIcon'
import { resolvePwaAvatarCandidates, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import { createSolidPng } from '@/lib/pwa/solidPng'
import type { MyCardData } from '@interfaces/api/myCard'
import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'

const ICON_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800'
/** Short TTL so browsers retry after a public-API rate-limit window. */
const DEGRADED_ICON_CACHE_CONTROL = 'public, max-age=30, stale-while-revalidate=60'

const ALLOWED_HOST_SUFFIXES = [
  'app.vbizme.com',
  'vbizme.com',
  'amazonaws.com',
  'cloudfront.net',
  'cloudinary.com',
  'nextcreavo.com',
  'digitaloceanspaces.com',
]

function extraAllowedHosts(): string[] {
  const hosts: string[] = []
  for (const raw of [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_API_URL, process.env.MEDIA_BASE_URL]) {
    const value = raw?.trim()
    if (!value) continue
    try {
      hosts.push(new URL(value).hostname.toLowerCase())
    } catch {
      /* ignore invalid env URLs */
    }
  }
  return hosts
}

function isAllowedAvatarHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1') return true
  if (host.includes('s3.') || host.endsWith('.s3.amazonaws.com')) return true
  if (extraAllowedHosts().some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) return true
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

function isBlockedAvatarHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === '169.254.169.254' || host.endsWith('.169.254.169.254')) return true
  if (host === 'metadata.google.internal') return true
  return false
}

function pathLooksLikeImage(pathname: string): boolean {
  return /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(pathname)
}

function resolveFetchUrl(avatarUrl: string, origin: string): string | null {
  if (avatarUrl.startsWith('/')) {
    return `${origin.replace(/\/$/, '')}${avatarUrl}`
  }
  try {
    const parsed = new URL(avatarUrl)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    if (isBlockedAvatarHost(parsed.hostname)) return null
    if (isAllowedAvatarHost(parsed.hostname) || pathLooksLikeImage(parsed.pathname)) {
      return parsed.toString()
    }
    // Allow public hosts so image bytes can still be sniffed after fetch.
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

function sniffImageContentType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
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
    const headerType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (headerType.startsWith('text/html') || headerType.startsWith('video/') || headerType.startsWith('audio/')) {
      return null
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    const sniffed = sniffImageContentType(buffer)
    const contentType = sniffed || (headerType.startsWith('image/') ? headerType : null)
    if (!contentType) return null
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

async function firstRenderableAvatar(urls: string[], origin: string): Promise<string | null> {
  for (const url of urls) {
    const photo = await avatarDataUrl(url, origin)
    if (photo) return photo
  }
  return null
}

function pngResponse(buffer: Buffer, cacheControl = ICON_CACHE_CONTROL): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': cacheControl,
    },
  })
}

function solidFallback(size: number, degraded = false) {
  return pngResponse(createSolidPng(size), degraded ? DEGRADED_ICON_CACHE_CONTROL : ICON_CACHE_CONTROL)
}

async function loadCardForIcon(slug: string): Promise<{ card: MyCardData | null; degraded: boolean }> {
  try {
    return { card: await fetchCardForPublicIcon(slug), degraded: false }
  } catch (error) {
    if (error instanceof PublicCardApiError) {
      console.warn('[renderPublicCardPwaIcon] using degraded icon', {
        slug,
        kind: error.kind,
        status: error.status,
        requestId: error.requestId,
      })
      return { card: null, degraded: true }
    }
    console.warn('[renderPublicCardPwaIcon] unexpected card fetch failure; using degraded icon', {
      slug,
      message: error instanceof Error ? error.message : String(error),
    })
    return { card: null, degraded: true }
  }
}

export async function renderPublicCardPwaIcon(slug: string, size: 192 | 512, origin: string): Promise<Response> {
  const { card, degraded } = await loadCardForIcon(slug)
  const ownerName = card?.profile?.name?.trim() || card?.profile?.company_name?.trim() || ''
  const name = resolvePwaDisplayName(ownerName, slug)
  const candidates = card ? resolvePwaAvatarCandidates(card) : []
  const photoSrc = await firstRenderableAvatar(candidates, origin)
  const initials = initialsFromName(name)
  const cacheControl = degraded ? DEGRADED_ICON_CACHE_CONTROL : ICON_CACHE_CONTROL

  try {
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
          'Cache-Control': cacheControl,
        },
      }
    )
  } catch {
    return solidFallback(size, degraded)
  }
}
