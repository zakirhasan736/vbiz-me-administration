import { fetchPublicCardSitemapEntries } from '@/lib/seo/fetchPublicCardSitemapEntries'
import { buildLlmsIndex, resolveAiSiteOrigin } from '@/lib/seo/publicCardLlms'

export const revalidate = 3600

/** Plain-text index of published cards for LLM crawlers. */
export async function GET(request: Request) {
  const origin = resolveAiSiteOrigin(request)
  let cards = await fetchPublicCardSitemapEntries(origin)
  if (!cards.length) cards = await fetchPublicCardSitemapEntries(origin)
  const body = buildLlmsIndex(
    origin,
    cards.map((card) => ({
      name: card.name,
      url: card.url,
      markdownUrl: `${card.url}/llms.txt`,
      summary: card.summary,
    }))
  )

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': cards.length ? 'public, max-age=3600' : 'no-store',
    },
  })
}
