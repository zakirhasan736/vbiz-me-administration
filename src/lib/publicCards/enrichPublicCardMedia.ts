import type { PublicCardListItem } from '@/lib/api/publicCards/mapPublicCards'
import { initialsFromPublicCardName, isGenericPublicCardImage } from '@/lib/publicCards/publicCardImage'
import type { MyCardData, MyCardMediaBlock } from '@interfaces/api/myCard'

function resolveMediaBlock(block?: MyCardMediaBlock | null): { src: string | null; isVideo: boolean } {
  if (!block?.enabled) return { src: null, isVideo: false }

  const candidates: Array<{ url?: string | null; isVideo?: boolean; extension?: string }> = [
    { url: block.url, isVideo: block.is_video, extension: block.extension },
    { url: block.video_url, isVideo: true, extension: block.extension },
    { url: block.regular_video?.url, isVideo: true, extension: block.regular_video?.extension },
  ]

  for (const candidate of candidates) {
    const url = candidate.url?.trim()
    if (!url || isGenericPublicCardImage(url)) continue

    const isVideo =
      candidate.isVideo === true ||
      candidate.extension?.toLowerCase() === 'mp4' ||
      candidate.extension?.toLowerCase() === 'webm' ||
      /\.(mp4|webm|mov)(\?|$)/i.test(url)

    return { src: url, isVideo }
  }

  return { src: null, isVideo: false }
}

/** Pull avatar/thumbnail from full profile payload when public-cards returns the vBiz logo. */
export function resolvePublicCardMediaFromMyCard(data: MyCardData): { src: string | null; isVideo: boolean } {
  const fromProfile = resolveMediaBlock(data.profile_media)
  if (fromProfile.src) return fromProfile

  const fromIntro = resolveMediaBlock(data.intro_video)
  if (fromIntro.src) return fromIntro

  return { src: null, isVideo: false }
}

export function needsPublicCardMediaEnrichment(item: PublicCardListItem): boolean {
  return !item.img
}

export function applyPublicCardMediaEnrichment(
  item: PublicCardListItem,
  media: { src: string | null; isVideo: boolean }
): PublicCardListItem {
  if (!media.src) return item
  return {
    ...item,
    img: media.src,
    isVideo: media.isVideo,
  }
}

export function buildEnrichedPublicCardListItem(item: PublicCardListItem, data: MyCardData): PublicCardListItem {
  if (!needsPublicCardMediaEnrichment(item)) return item
  return applyPublicCardMediaEnrichment(item, resolvePublicCardMediaFromMyCard(data))
}

export function createFallbackPublicCardListItem(item: PublicCardListItem): PublicCardListItem {
  return {
    ...item,
    initials: initialsFromPublicCardName(item.name),
  }
}
