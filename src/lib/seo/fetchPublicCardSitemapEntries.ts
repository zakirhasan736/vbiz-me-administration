import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'
import { buildProfilePath } from '@/lib/profileRoutes'
import { buildPublicCardCanonicalUrl } from '@/lib/seo/publicCardSeo'
import { getSiteOrigin } from '@/lib/seo/siteOrigin'

export type PublicCardSitemapEntry = {
  slug: string
  url: string
  name: string
  summary: string
  lastModified?: Date
}

type PublicCardsPagePayload = {
  success?: boolean
  data?: {
    data?: Array<{
      slug?: string | null
      name?: string | null
      designation?: string | null
      profession?: string | null
      updated_at?: string | null
    }>
    last_page?: number
    current_page?: number
  }
}

const MAX_SITEMAP_PAGES = 50
const PER_PAGE = 100

/**
 * Public `/vCard/{slug}` URLs for sitemap.xml — only directory-listed public cards.
 */
export async function fetchPublicCardSitemapEntries(origin = getSiteOrigin()): Promise<PublicCardSitemapEntry[]> {
  const entries: PublicCardSitemapEntry[] = []
  const seen = new Set<string>()
  let page = 1
  let lastPage = 1

  while (page <= lastPage && page <= MAX_SITEMAP_PAGES) {
    const url = `${getApiBaseUrl()}/public-cards?page=${page}&per_page=${PER_PAGE}&dropdowns=0`
    let response: Response
    try {
      response = await fetchPublicCardResponse(url)
    } catch {
      break
    }
    if (!response.ok) break

    let json: PublicCardsPagePayload
    try {
      json = (await response.json()) as PublicCardsPagePayload
    } catch {
      break
    }

    const rows = Array.isArray(json.data?.data) ? json.data.data : []
    lastPage = Math.max(1, Number(json.data?.last_page) || 1)

    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : ''
      if (!slug || seen.has(slug)) continue
      seen.add(slug)
      const updated = row.updated_at ? new Date(row.updated_at) : undefined
      const designation = typeof row.designation === 'string' ? row.designation.trim() : ''
      const profession = typeof row.profession === 'string' ? row.profession.trim() : ''
      const summary =
        designation && profession && designation.toLowerCase() !== profession.toLowerCase()
          ? `${designation}, ${profession}`
          : designation || profession
      entries.push({
        slug,
        name: (typeof row.name === 'string' && row.name.trim()) || slug,
        summary,
        url: buildPublicCardCanonicalUrl(origin, buildProfilePath(slug)),
        lastModified: updated && !Number.isNaN(updated.getTime()) ? updated : undefined,
      })
    }

    if (page >= lastPage) break
    page += 1
  }

  return entries
}
