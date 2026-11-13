import { fetchPublicResource, PublicFetchError } from '@/lib/media/fetchPublicResource'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function sameSite(request: NextRequest): boolean {
  const host = request.headers.get('host')?.toLowerCase()
  const source = request.headers.get('origin') || request.headers.get('referer')
  if (!host || !source) return false
  try {
    return new URL(source).host.toLowerCase() === host
  } catch {
    return false
  }
}

function sniffImageType(bytes: Uint8Array, contentType: string): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif'
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
    return 'image/webp'
  }
  const type = contentType.split(';')[0]?.trim() || ''
  if (
    type === 'image/avif' ||
    type === 'image/jpeg' ||
    type === 'image/png' ||
    type === 'image/gif' ||
    type === 'image/webp'
  ) {
    if (bytes[0] === 0x3c || bytes[0] === 0x7b) return null
    return type
  }
  return null
}

export async function GET(request: NextRequest) {
  if (!sameSite(request)) {
    return NextResponse.json({ error: 'Image not allowed' }, { status: 403 })
  }

  const rawUrl = request.nextUrl.searchParams.get('url')?.trim() || ''
  if (!rawUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    const resource = await fetchPublicResource(rawUrl, { maxBytes: 8 * 1024 * 1024 })
    const type = sniffImageType(resource.bytes, resource.contentType)
    if (!type) return NextResponse.json({ error: 'URL is not an image' }, { status: 415 })
    return new NextResponse(Buffer.from(resource.bytes), {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const message = error instanceof PublicFetchError ? error.message : 'Failed to fetch image'
    const status = error instanceof PublicFetchError ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }
}
