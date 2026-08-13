import { renderPublicCardPwaIcon } from '@/lib/pwa/renderPublicCardIcon'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ slug: string; size: string }>
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug: rawSlug, size: rawSize } = await context.params
  const slug = rawSlug?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }
  const size: 192 | 512 = rawSize === '512' ? 512 : 192
  return renderPublicCardPwaIcon(slug, size, request.nextUrl.origin)
}
