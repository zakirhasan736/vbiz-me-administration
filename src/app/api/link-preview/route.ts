import { fetchPublicResource, isBlockedPublicHost, PublicFetchError } from '@/lib/media/fetchPublicResource'
import { parseGalleryLinkPreview, type GalleryLinkPreview } from '@/lib/media/linkPreview'
import { isImageUrl } from '@/lib/mediaUrl'
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

function imagePreview(url: string): GalleryLinkPreview {
  let siteName = ''
  let title = 'Photo'
  try {
    const parsed = new URL(url)
    siteName = parsed.hostname.replace(/^www\./, '')
    const name = decodeURIComponent(parsed.pathname.split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '')
    title = name.replace(/[-_]+/g, ' ').trim() || siteName || 'Photo'
  } catch {
    /* keep defaults */
  }
  return { url, title, description: '', image: url, siteName }
}

export async function GET(request: NextRequest) {
  if (!sameSite(request)) {
    return NextResponse.json({ error: 'Could not read that gallery page' }, { status: 403 })
  }

  const rawUrl = request.nextUrl.searchParams.get('url')?.trim() || ''
  if (!rawUrl) {
    return NextResponse.json({ error: 'Paste a gallery link' }, { status: 400 })
  }

  try {
    const parsed = new URL(rawUrl)
    if (isBlockedPublicHost(parsed.hostname)) {
      return NextResponse.json({ error: 'That link cannot be used' }, { status: 400 })
    }
    if (isImageUrl(parsed.toString())) {
      return NextResponse.json(imagePreview(parsed.toString()))
    }

    const resource = await fetchPublicResource(rawUrl, { maxBytes: 1_200_000 })
    if (resource.contentType.startsWith('image/')) {
      return NextResponse.json(imagePreview(resource.url))
    }
    const html = new TextDecoder().decode(resource.bytes)
    return NextResponse.json(parseGalleryLinkPreview(html, resource.url))
  } catch (error) {
    const message = error instanceof PublicFetchError ? error.message : 'Could not read that gallery page'
    const status = error instanceof PublicFetchError ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }
}
