import { NextRequest, NextResponse } from 'next/server'

const EXACT_HOSTS = new Set([
  'app.vbizme.com',
  'www.app.vbizme.com',
  'vbiz.me',
  'www.vbiz.me',
  'vbizme.com',
  'www.vbizme.com',
  'localhost',
  '127.0.0.1',
])

const HOST_SUFFIXES = ['.amazonaws.com', '.cloudfront.net', '.s3.amazonaws.com', '.digitaloceanspaces.com']

function hostFromEnv(raw?: string | null): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

function isPrivateHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false
  if (hostname === '0.0.0.0' || hostname === '::1') return true
  if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true
  if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)) return true
  return false
}

function isAllowedImageHost(hostname: string, requestHost?: string | null): boolean {
  const host = hostname.trim().toLowerCase()
  if (!host || isPrivateHostname(host)) return false
  if (EXACT_HOSTS.has(host)) return true
  if (requestHost && host === requestHost.toLowerCase()) return true
  const apiHost = hostFromEnv(process.env.NEXT_PUBLIC_API_URL)
  const appHost = hostFromEnv(process.env.NEXT_PUBLIC_APP_URL)
  if (apiHost && host === apiHost) return true
  if (appHost && host === appHost) return true
  return HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) || host.includes('.s3.'))
}

function sniffImageType(bytes: Uint8Array): 'JPEG' | 'PNG' | 'GIF' | 'WEBP' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'PNG'
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'GIF'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'WEBP'
  }
  return null
}

function typeFromContentType(contentType: string): 'JPEG' | 'PNG' | 'GIF' | 'WEBP' | null {
  const value = contentType.toLowerCase()
  if (value.includes('jpeg') || value.includes('jpg')) return 'JPEG'
  if (value.includes('png')) return 'PNG'
  if (value.includes('gif')) return 'GIF'
  if (value.includes('webp')) return 'WEBP'
  return null
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  if (!rawUrl?.trim()) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }
  if (parsed.protocol === 'http:' && !isLocal) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }
  if (!isAllowedImageHost(parsed.hostname, request.nextUrl.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }

  try {
    const response = await fetch(parsed.toString())
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const contentType = response.headers.get('content-type') || ''
    const sniffed = sniffImageType(bytes)
    const fromHeader = contentType.startsWith('image/') ? typeFromContentType(contentType) : null
    const type = sniffed || fromHeader
    if (!type) {
      return NextResponse.json({ error: 'URL is not an image' }, { status: 415 })
    }

    const base64 = Buffer.from(buffer).toString('base64')
    return NextResponse.json({ base64, type: type === 'PNG' || type === 'GIF' || type === 'WEBP' ? type : 'JPEG' })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
