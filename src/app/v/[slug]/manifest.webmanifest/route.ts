import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { buildPublicCardManifest, manifestJsonResponse } from '@/lib/pwa/resolvePublicCardPwa'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params
  const slug = rawSlug?.trim()
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 })
  }

  const card = await fetchMyCardBySlug(slug)
  return manifestJsonResponse(buildPublicCardManifest(card, slug))
}
