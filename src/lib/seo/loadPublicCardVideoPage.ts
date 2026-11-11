import { fetchPublicCardBootstrap } from '@/lib/api/myCard/fetchPublicCardBootstrap'
import { mapMyCardToVCardData } from '@/lib/api/myCard/mapMyCard'
import { buildProfilePath } from '@/lib/profileRoutes'
import { getHomeMediaUrls, resolveDisplaySettings } from '@/lib/vcardDisplaySettings'
import {
  buildPublicCardCanonicalUrl,
  isPublicCardIndexable,
  resolvePublicCardImageUrl,
} from '@/lib/seo/publicCardSeo'
import { assemblePublicCardSource } from '@/lib/seo/publicCardSource'
import {
  buildPublicCardVideoPath,
  buildPublicCardVideoTitle,
  resolveIntroVideo,
  uploadDateFromMediaUrl,
  type PublicCardIntroVideo,
} from '@/lib/seo/publicCardVideo'

export type PublicCardVideoPage = {
  slug: string
  name: string
  title: string
  description: string
  cardPath: string
  cardUrl: string
  watchPath: string
  watchUrl: string
  personId: string
  video: PublicCardIntroVideo
  thumbnailUrl: string
  uploadDate: string | null
}

const MAX_DESCRIPTION = 300

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** The intro video URL the public card itself plays (file preferred, else YouTube). */
export function resolveCardIntroVideoUrl(myCard: Parameters<typeof mapMyCardToVCardData>[0]): string {
  const settings = resolveDisplaySettings(mapMyCardToVCardData(myCard).displaySettings)
  return getHomeMediaUrls(settings).introPlayUrl || ''
}

/**
 * Everything the /vCard/{slug}/video page needs, or:
 * - `{ status: 'missing' }` when the card doesn't exist or isn't indexable (404)
 * - `{ status: 'no-video' }` when the card exists but has no intro video (send to the card)
 * Throws when the API is unreachable and no cached copy exists.
 */
export async function loadPublicCardVideoPage(
  slug: string,
  origin: string
): Promise<{ status: 'ok'; page: PublicCardVideoPage } | { status: 'missing' } | { status: 'no-video' }> {
  const bootstrap = await fetchPublicCardBootstrap(slug)
  const myCard = bootstrap?.myCard
  if (!myCard || !isPublicCardIndexable(myCard.profile)) return { status: 'missing' }

  const video = resolveIntroVideo(resolveCardIntroVideoUrl(myCard))
  if (!video) return { status: 'no-video' }

  const source = assemblePublicCardSource({ slug, origin, myCard, sections: bootstrap.sections })
  const cardPath = buildProfilePath(slug)
  const watchPath = buildPublicCardVideoPath(cardPath)
  const cardUrl = buildPublicCardCanonicalUrl(origin, cardPath)
  const title = buildPublicCardVideoTitle(source.name, source.companyLine)
  const description = truncate(
    source.about || `Watch ${source.name}'s introduction video and connect through their vBiz Me digital card.`,
    MAX_DESCRIPTION
  )

  return {
    status: 'ok',
    page: {
      slug,
      name: source.name,
      title,
      description,
      cardPath,
      cardUrl,
      watchPath,
      watchUrl: buildPublicCardCanonicalUrl(origin, watchPath),
      personId: `${cardUrl}#person`,
      video,
      thumbnailUrl: video.kind === 'youtube' ? video.thumbnailUrl : resolvePublicCardImageUrl(myCard, origin, slug),
      uploadDate: video.kind === 'file' ? uploadDateFromMediaUrl(video.contentUrl) : null,
    },
  }
}
