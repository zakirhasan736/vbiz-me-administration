import { fetchPublicCardSitemapEntries } from '@/lib/seo/fetchPublicCardSitemapEntries'
import { getSiteOrigin } from '@/lib/seo/siteOrigin'
import type { MetadataRoute } from 'next'

/** Refresh public-card URLs for Search Console roughly hourly. */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin()
  const cards = await fetchPublicCardSitemapEntries(origin)

  return cards.map((card) => ({
    url: card.url,
    lastModified: card.lastModified ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))
}
