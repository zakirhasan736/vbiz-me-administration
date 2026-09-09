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

function isAllowedMediaHost(hostname: string, requestHost?: string | null): boolean {
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

function safeDownloadName(raw?: string | null): string | null {
  if (!raw?.trim()) return null
  const cleaned = raw
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 120)
  return cleaned || null
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
  if (!isAllowedMediaHost(parsed.hostname, request.nextUrl.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }

  try {
    const response = await fetch(parsed.toString())
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const downloadName = safeDownloadName(request.nextUrl.searchParams.get('download'))
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    })
    if (downloadName) {
      headers.set('Content-Disposition', `attachment; filename="${downloadName}"`)
    }

    return new NextResponse(buffer, { headers })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 502 })
  }
}
