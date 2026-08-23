import { decodeHtmlText } from '@/lib/htmlText'
import { initialsFromPublicCardName, resolvePublicCardImage } from '@/lib/publicCards/publicCardImage'
import type { PublicCard, PublicCardsQueryResult, PublicCardsResponse } from '@interfaces/api/publicCards'

export function normalizePublicCardsResponse(response: PublicCardsResponse): PublicCardsQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load public cards')
  }

  const cards = response.data.data.map((card) => ({
    ...card,
    name: decodeHtmlText(card.name),
    profession: card.profession == null ? null : decodeHtmlText(card.profession),
  }))

  return {
    cards,
    pagination: {
      ...response.data,
      data: cards,
      links: response.data.links.map((link) => ({ ...link, label: decodeHtmlText(link.label) })),
    },
    filtersApplied: response.filters_applied,
    dropdowns: response.dropdowns
      ? Object.fromEntries(
          Object.entries(response.dropdowns).map(([key, options]) => [
            key,
            options?.map((option) => ({ ...option, name: decodeHtmlText(option.name) })),
          ])
        )
      : undefined,
  }
}

import { buildProfilePath } from '@/lib/profileRoutes'

export function mapPublicCardProfileUrl(slug: string, fallback?: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${buildProfilePath(slug)}`
  }
  return fallback ?? `https://vbiz.me/${slug}`
}

export type PublicCardListItem = {
  id: number
  name: string
  profession: string
  professionId: number | null
  img: string | null
  isVideo: boolean
  initials: string
  slug: string
}

export function mapPublicCardToListItem(card: PublicCard): PublicCardListItem {
  const image = resolvePublicCardImage(card)
  return {
    id: card.id,
    name: decodeHtmlText(card.name),
    profession: decodeHtmlText(card.profession?.trim() || 'Professional'),
    professionId: card.profession_id,
    img: image.src,
    isVideo: image.isVideo,
    initials: initialsFromPublicCardName(decodeHtmlText(card.name)),
    slug: card.slug,
  }
}
