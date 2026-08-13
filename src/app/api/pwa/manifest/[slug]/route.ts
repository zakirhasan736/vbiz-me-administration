import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { buildPublicCardStartUrl, buildPwaIconUrl, resolvePublicCardPwaMeta } from '@/lib/pwa/resolvePublicCardPwa'
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
  const icon192 = buildPwaIconUrl(origin, slug, 192)
  const icon512 = buildPwaIconUrl(origin, slug, 512)

  const manifest = {
    id: `/v/${encodeURIComponent(slug)}`,
    name: meta.name,
    short_name: meta.shortName,
    description: `${meta.name}'s digital business card`,
    start_url: buildPublicCardStartUrl(origin, slug),
    scope: `/v/${encodeURIComponent(slug)}`,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'any',
    background_color: meta.backgroundColor,
    theme_color: meta.themeColor,
    prefer_related_applications: false,
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
