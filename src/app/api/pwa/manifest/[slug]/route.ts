import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import {
  buildPublicCardStartUrl,
  buildPwaIconUrl,
  pwaFallbackIconPath,
  resolvePublicCardPwaMeta,
} from '@/lib/pwa/resolvePublicCardPwa'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ slug: string }>
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

  const origin = request.nextUrl.origin
  const meta = resolvePublicCardPwaMeta(card, slug)
  const icon192 = meta.avatarUrl ? buildPwaIconUrl(origin, slug, 192) : `${origin}${pwaFallbackIconPath()}`
  const icon512 = meta.avatarUrl ? buildPwaIconUrl(origin, slug, 512) : `${origin}${pwaFallbackIconPath()}`

  const manifest = {
    id: `/v/${encodeURIComponent(slug)}`,
    name: meta.name,
    short_name: meta.shortName,
    description: `${meta.name}'s digital business card`,
    start_url: buildPublicCardStartUrl(origin, slug),
    scope: `/v/${encodeURIComponent(slug)}`,
    display: 'standalone',
    orientation: 'any',
    background_color: meta.backgroundColor,
    theme_color: meta.themeColor,
    icons: [
      {
        src: icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
