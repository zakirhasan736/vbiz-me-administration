import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import type { VCardData, VCardSectionPostItem } from '@/types/vcard'

/** Intro preloader (Home Media tab) — not the 2D Explainer tab. */
export const INTRO_VIDEO_FIELD = 'Intro vCard Video'
export const INTRO_YOUTUBE_FIELD = 'Intro YouTube vCard Video Link'

/** 2D Explainer tab + Media & Profile explainer upload. */
export const EXPLAINER_SECTION = PUBLIC_SECTION_NAMES.explainer
export const EXPLAINER_ATTACHMENT_TYPE = '2D Video Explainer'

export function isYoutubeMediaUrl(url: string): boolean {
  return /youtu\.?be/i.test(url)
}

function primaryExplainerItem(items: VCardSectionPostItem[] | undefined): VCardSectionPostItem | null {
  const list = items ?? []
  const active = list.filter((item) => item.active !== false)
  return active[0] ?? list[0] ?? null
}

/** Read the primary 2D explainer file / external URL from section posts (not intro video). */
export function readExplainerSectionMedia(data: VCardData): { fileUrl: string; externalUrl: string } {
  const item = primaryExplainerItem(data.sectionPosts?.[EXPLAINER_SECTION])
  if (!item) return { fileUrl: '', externalUrl: '' }

  const featured = item.featuredImage?.trim() || ''
  const link = item.url?.trim() || ''

  if (featured && !isYoutubeMediaUrl(featured)) {
    return {
      fileUrl: featured,
      externalUrl: link && isYoutubeMediaUrl(link) ? link : '',
    }
  }

  if (link && isYoutubeMediaUrl(link)) return { fileUrl: '', externalUrl: link }
  if (link) return { fileUrl: link, externalUrl: '' }

  return { fileUrl: '', externalUrl: '' }
}

/** Update the primary 2D explainer row without touching intro video settings. */
export function patchExplainerSectionMedia(
  data: VCardData,
  patch: { fileUrl?: string; externalUrl?: string }
): VCardData {
  const current = readExplainerSectionMedia(data)
  const fileUrl = patch.fileUrl !== undefined ? patch.fileUrl.trim() : current.fileUrl
  const externalUrl = patch.externalUrl !== undefined ? patch.externalUrl.trim() : current.externalUrl

  const existing = [...(data.sectionPosts?.[EXPLAINER_SECTION] ?? [])]
  const previous = existing[0]

  if (!fileUrl && !externalUrl) {
    const nextItems = existing.length <= 1 ? [] : existing.slice(1)
    return {
      ...data,
      sectionPosts: {
        ...(data.sectionPosts || {}),
        [EXPLAINER_SECTION]: nextItems,
      },
    }
  }

  const item: VCardSectionPostItem = {
    id: previous?.id || `sec_explainer_${Date.now()}`,
    title: previous?.title?.trim() || '2D Video Explainer',
    description: previous?.description || '',
    url: externalUrl || fileUrl,
    featuredImage: fileUrl && !isYoutubeMediaUrl(fileUrl) ? fileUrl : '',
    date: previous?.date || '',
    rating: previous?.rating || '',
    location: previous?.location || '',
    active: true,
    metas: previous?.metas,
  }

  const rest = existing.length > 1 ? existing.slice(1) : []
  return {
    ...data,
    sectionPosts: {
      ...(data.sectionPosts || {}),
      [EXPLAINER_SECTION]: [item, ...rest],
    },
  }
}

/** @deprecated Intro and explainer are separate; kept as identity for legacy imports. */
export function applyProfileMediaToExplainerTab(data: VCardData): VCardData {
  return data
}

export function explainerTabSignature(data: VCardData): string {
  return JSON.stringify(data.sectionPosts?.[EXPLAINER_SECTION] ?? [])
}

/** True when editing explainer section posts (not intro video display fields). */
export function isExplainerMediaPath(path: string): boolean {
  return path === 'sectionPosts' || path.startsWith(`sectionPosts.${EXPLAINER_SECTION}`)
}
