import { fetchPublicCardBootstrap } from '@/lib/api/myCard/fetchPublicCardBootstrap'
import { buildPublicCardMarkdown, resolveAiSiteOrigin } from '@/lib/seo/publicCardLlms'
import { isPublicCardIndexable } from '@/lib/seo/publicCardSeo'
import { assemblePublicCardSource } from '@/lib/seo/publicCardSource'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
}

/** Plain-text card for LLM crawlers. Drafts are omitted. */
export async function GET(request: Request, { params }: Props) {
  const { slug } = await params
  const trimmed = slug?.trim()
  if (!trimmed) return new Response('Not found', { status: 404 })

  let bootstrap: Awaited<ReturnType<typeof fetchPublicCardBootstrap>>
  try {
    bootstrap = await fetchPublicCardBootstrap(trimmed)
  } catch {
    return new Response('Unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  if (!bootstrap?.myCard || !isPublicCardIndexable(bootstrap.myCard.profile)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  const body = buildPublicCardMarkdown(
    assemblePublicCardSource({
      slug: trimmed,
      origin: resolveAiSiteOrigin(request),
      myCard: bootstrap.myCard,
      sections: bootstrap.sections,
    })
  )

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  })
}
