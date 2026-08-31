import { getApiBaseUrl } from '@/lib/api/serverApi'
import { collectPublicCardShareImageCandidates } from '@/lib/seo/resolvePublicCardSeo'
import type { MyCardData } from '@interfaces/api/myCard'

function featuredImageFromAboutSection(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const data = payload as { data?: { items?: Array<{ featured_image?: unknown; status?: unknown }> } }
  const item = data.data?.items?.[0]
  if (!item) return ''
  const status = item.status
  if (status === 0 || status === '0' || status === false) return ''
  const featured = item.featured_image
  return typeof featured === 'string' ? featured.trim() : ''
}

/** Ensure About Me featured media is present for share previews when avatar is video-only. */
export async function enrichMyCardForSharePreview(card: MyCardData): Promise<MyCardData> {
  if (collectPublicCardShareImageCandidates(card).length > 0) return card

  const profileId = String(card.profile?.id ?? '').trim()
  if (!profileId) return card

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/dynamic-section/${encodeURIComponent('About Me')}?profile_id=${encodeURIComponent(profileId)}`,
      { next: { revalidate: 60 } }
    )
    if (!response.ok) return card
    const json: unknown = await response.json()
    const featuredImage = featuredImageFromAboutSection(json)
    if (!featuredImage) return card

    return {
      ...card,
      settings: {
        ...card.settings,
        about_me_featured_media_url: featuredImage,
        share_preview_image_url: featuredImage,
      },
    }
  } catch {
    return card
  }
}
