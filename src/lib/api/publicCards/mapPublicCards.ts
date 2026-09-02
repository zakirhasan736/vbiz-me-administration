import { decodeHtmlText } from '@/lib/htmlText'
import { buildProfilePath } from '@/lib/profileRoutes'
import { initialsFromPublicCardName, resolvePublicCardImage } from '@/lib/publicCards/publicCardImage'
import type {
  PublicCard,
  PublicCardsPaginatedData,
  PublicCardsPaginationLink,
  PublicCardsQueryResult,
  PublicCardsResponse,
} from '@interfaces/api/publicCards'

function asCardList(value: unknown): PublicCard[] {
  return Array.isArray(value) ? (value as PublicCard[]) : []
}

function buildPaginationLinks(page: number, lastPage: number): PublicCardsPaginationLink[] {
  const links: PublicCardsPaginationLink[] = [
    {
      url: page > 1 ? `?page=${page - 1}` : null,
      label: '&laquo; Previous',
      active: false,
    },
  ]
  for (let i = 1; i <= lastPage; i += 1) {
    links.push({
      url: `?page=${i}`,
      label: String(i),
      active: i === page,
    })
  }
  links.push({
    url: page < lastPage ? `?page=${page + 1}` : null,
    label: 'Next &raquo;',
    active: false,
  })
  return links
}

/** Normalize Laravel-shaped or vbiz Express `/public-cards` payloads into UI-ready cards. */
export function normalizePublicCardsResponse(response: PublicCardsResponse): PublicCardsQueryResult {
  if (!response?.success || !response.data) {
    throw new Error(response?.error || 'Failed to load public cards')
  }

  const pageData = response.data
  const rawCards = asCardList(pageData.data)
  const currentPage = Number(pageData.current_page) || Number(response.pagination?.current_page) || 1
  const lastPage = Number(pageData.last_page) || Number(response.pagination?.last_page) || 1
  const perPage = Number(pageData.per_page) || Number(response.pagination?.per_page) || rawCards.length || 12
  const total = Number(pageData.total) || Number(response.pagination?.total) || rawCards.length

  const cards = rawCards.map((card) => ({
    ...card,
    id: card.id,
    name: decodeHtmlText(card.name),
    profession: card.profession == null ? null : decodeHtmlText(card.profession),
    profession_id: card.profession_id ?? null,
    designation: card.designation == null ? null : decodeHtmlText(card.designation),
    image: card.image ?? '',
    image_type: card.image_type ?? '',
    is_video: Boolean(card.is_video),
    profile_url: card.profile_url || (card.slug ? buildProfilePath(card.slug) : ''),
  }))

  const links = Array.isArray(pageData.links)
    ? pageData.links.map((link) => ({ ...link, label: decodeHtmlText(link.label) }))
    : buildPaginationLinks(currentPage, lastPage)

  const pagination: PublicCardsPaginatedData = {
    current_page: currentPage,
    data: cards,
    first_page_url: pageData.first_page_url || '?page=1',
    from: pageData.from ?? (total === 0 ? null : (currentPage - 1) * perPage + 1),
    last_page: lastPage,
    last_page_url: pageData.last_page_url || `?page=${lastPage}`,
    links,
    next_page_url:
      pageData.next_page_url ??
      response.pagination?.next_page_url ??
      (currentPage < lastPage ? `?page=${currentPage + 1}` : null),
    path: pageData.path || '/public-cards',
    per_page: perPage,
    prev_page_url:
      pageData.prev_page_url ??
      response.pagination?.prev_page_url ??
      (currentPage > 1 ? `?page=${currentPage - 1}` : null),
    to: pageData.to ?? (total === 0 ? null : Math.min(currentPage * perPage, total)),
    total,
  }

  return {
    cards,
    pagination,
    filtersApplied: response.filters_applied,
    dropdowns: response.dropdowns
      ? Object.fromEntries(
          Object.entries(response.dropdowns).map(([key, options]) => [
            key,
            (Array.isArray(options) ? options : []).map((option) => ({
              ...option,
              name: decodeHtmlText(option.name),
            })),
          ])
        )
      : undefined,
  }
}

export function mapPublicCardProfileUrl(slug: string, fallback?: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${buildProfilePath(slug)}`
  }
  return fallback ?? `https://vbiz.me/vCard/${encodeURIComponent(slug.trim())}`
}

export type PublicCardListItem = {
  id: string | number
  name: string
  profession: string
  designation: string | null
  /** Designation preferred, then profession — shown under the owner name. */
  roleLabel: string
  professionId: string | number | null
  img: string | null
  isVideo: boolean
  initials: string
  slug: string
}

export function mapPublicCardToListItem(card: PublicCard): PublicCardListItem {
  const image = resolvePublicCardImage(card)
  const name = decodeHtmlText(card.name)
  const designation = card.designation == null ? null : decodeHtmlText(card.designation.trim()) || null
  const profession = decodeHtmlText(card.profession?.trim() || '') || null
  return {
    id: card.id,
    name,
    profession: profession || 'Professional',
    designation,
    roleLabel: designation || profession || 'Professional',
    professionId: card.profession_id,
    img: image.src,
    isVideo: image.isVideo,
    initials: initialsFromPublicCardName(name),
    slug: card.slug,
  }
}
