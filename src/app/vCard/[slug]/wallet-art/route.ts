import { renderWalletCardArt } from '@/lib/pwa/renderWalletCardArt'
import { parseWalletArtFormat } from '@/lib/pwa/walletCardBrand'
import { NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export const runtime = 'nodejs'

export async function GET(request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params
  const slug = rawSlug?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }
  const url = new URL(request.url)
  const format = parseWalletArtFormat(url.searchParams.get('format'))
  return renderWalletCardArt(slug, url.origin, format)
}
