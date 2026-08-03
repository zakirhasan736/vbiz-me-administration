import { initialsFromPublicCardName, resolvePublicCardImage } from '@/lib/publicCards/publicCardImage'
import type { PublicCard, PublicCardsQueryResult, PublicCardsResponse } from '@interfaces/api/publicCards'

export function normalizePublicCardsResponse(response: PublicCardsResponse): PublicCardsQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load public cards')
  }

  return {
    cards: response.data.data,
    pagination: response.data,
    filtersApplied: response.filters_applied,
    dropdowns: response.dropdowns,
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
    name: card.name,
    profession: card.profession?.trim() || 'Professional',
    professionId: card.profession_id,
    img: image.src,
    isVideo: image.isVideo,
    initials: initialsFromPublicCardName(card.name),
    slug: card.slug,
  }
}
