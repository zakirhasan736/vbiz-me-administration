import { fetchPublicCardSitemapEntries, type PublicCardSitemapEntry } from '@/lib/seo/fetchPublicCardSitemapEntries'
import { buildPublicCardVideoPath, resolveIntroVideo, uploadDateFromMediaUrl } from '@/lib/seo/publicCardVideo'
import { getSiteOrigin } from '@/lib/seo/siteOrigin'
import type { MetadataRoute } from 'next'

/** Refresh public-card URLs for Search Console roughly hourly. */
export const revalidate = 3600

/** Intro-video watch page entry (/vCard/{slug}/video) with Google video sitemap tags. */
function videoEntry(card: PublicCardSitemapEntry): MetadataRoute.Sitemap[number] | null {
  const video = resolveIntroVideo(card.introVideoUrl)
  if (!video) return null
  const thumbnail = video.kind === 'youtube' ? video.thumbnailUrl : card.image
  const watchUrl = buildPublicCardVideoPath(card.url)
  const base = { url: watchUrl, lastModified: card.lastModified ?? new Date(), changeFrequency: 'monthly' as const }
  // Google requires a thumbnail for <video:video>; without one, still list the page itself.
  if (!thumbnail) return base

  const title = card.summary ? `Meet ${card.name} – ${card.summary}` : `Meet ${card.name}`
  const publication = video.kind === 'file' ? uploadDateFromMediaUrl(video.contentUrl) : null
  return {
    ...base,
    videos: [
      {
        title,
        thumbnail_loc: thumbnail,
        description: `Watch ${card.name}'s introduction video on vBiz Me.`,
        ...(video.kind === 'file' ? { content_loc: video.contentUrl } : { player_loc: video.embedUrl }),
        ...(publication ? { publication_date: publication } : {}),
        family_friendly: 'yes',
      },
    ],
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin()
  const cards = await fetchPublicCardSitemapEntries(origin)

  const entries: MetadataRoute.Sitemap = []
  for (const card of cards) {
    entries.push({
      url: card.url,
      lastModified: card.lastModified ?? new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
    const video = videoEntry(card)
    if (video) entries.push(video)
  }
  return entries
}
