import type {
  PublicCard,
  PublicCardsFilterOption,
  PublicCardsFiltersApplied,
  PublicCardsSearchParams,
} from '@interfaces/api/publicCards'

export const PUBLIC_CARDS_SEARCH_MIN_CHARS = 2
export const PUBLIC_CARDS_SEARCH_DEBOUNCE_MS = 350
export const PUBLIC_CARDS_INITIAL_PER_PAGE = 20
/** Matches backend total (~60) so one request loads the full directory for images + profession filters. */
export const PUBLIC_CARDS_CATALOG_PER_PAGE = 60
export const PUBLIC_CARDS_MAX_PER_PAGE = 100

export type PublicCardsFilterState = {
  stateId: number | null
  cityId: number | null
  professionId: number | null
  service: string
}

export const EMPTY_PUBLIC_CARDS_FILTERS: PublicCardsFilterState = {
  stateId: null,
  cityId: null,
  professionId: null,
  service: '',
}

export function hasActivePublicCardsFilters(filters: PublicCardsFilterState): boolean {
  return (
    filters.stateId != null ||
    filters.cityId != null ||
    filters.professionId != null ||
    isPublicCardsSearchReady(filters.service)
  )
}

export function isPublicCardsSearchReady(query: string): boolean {
  return query.trim().length >= PUBLIC_CARDS_SEARCH_MIN_CHARS
}

export function normalizePublicCardsSearchQuery(query: string): string {
  return query.trim()
}

export function buildPublicCardsSearchParams(
  filters: PublicCardsFilterState,
  page?: number,
  options?: { perPage?: number }
): PublicCardsSearchParams {
  const params: PublicCardsSearchParams = {}

  if (page != null && page > 0) params.page = page
  if (options?.perPage != null && options.perPage > 0) params.per_page = options.perPage
  if (filters.stateId != null) params.state_id = filters.stateId
  if (filters.cityId != null) params.city_id = filters.cityId
  if (filters.professionId != null) params.profession_id = filters.professionId

  const service = normalizePublicCardsSearchQuery(filters.service)
  if (isPublicCardsSearchReady(service)) {
    params.service = service
    params.search = service
  }

  return params
}

export function buildPublicCardsQueryPath(params?: PublicCardsSearchParams): string {
  const search = new URLSearchParams()

  if (params?.page) search.set('page', String(params.page))
  if (params?.per_page) search.set('per_page', String(params.per_page))
  if (params?.state_id) search.set('state_id', String(params.state_id))
  if (params?.city_id) search.set('city_id', String(params.city_id))
  if (params?.profession_id) search.set('profession_id', String(params.profession_id))
  if (params?.service) search.set('service', params.service)
  if (params?.search) search.set('search', params.search)

  const qs = search.toString()
  return `/public-cards${qs ? `?${qs}` : ''}`
}

/** Professions that appear on the loaded public cards (not the full API professions list). */
export function deriveProfessionOptionsFromPublicCards(cards: PublicCard[]): PublicCardsFilterOption[] {
  const byId = new Map<number, string>()

  for (const card of cards) {
    if (card.profession_id == null) continue
    const name = card.profession?.trim()
    if (!name) continue
    byId.set(card.profession_id, name)
  }

  return Array.from(byId.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function deriveProfessionOptionsFromListItems(
  cards: Array<{ professionId: number | null; profession: string }>
): PublicCardsFilterOption[] {
  const byId = new Map<number, string>()

  for (const card of cards) {
    if (card.professionId == null) continue
    const name = card.profession?.trim()
    if (!name || name === 'Professional') continue
    byId.set(card.professionId, name)
  }

  return Array.from(byId.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function filterPublicCardsByQuery<T extends { name: string; profession: string; slug: string }>(
  cards: T[],
  query: string
): T[] {
  const normalized = normalizePublicCardsSearchQuery(query).toLowerCase()
  if (!isPublicCardsSearchReady(normalized)) return cards

  return cards.filter((card) => {
    const haystack = [card.name, card.profession, card.slug].join(' ').toLowerCase()
    return haystack.includes(normalized)
  })
}

export function parsePublicCardsFiltersApplied(applied?: PublicCardsFiltersApplied): PublicCardsFilterState {
  if (!applied) return { ...EMPTY_PUBLIC_CARDS_FILTERS }

  return {
    stateId: applied.state_id ? Number(applied.state_id) : null,
    cityId: applied.city_id ? Number(applied.city_id) : null,
    professionId: applied.profession_id ? Number(applied.profession_id) : null,
    service: applied.service ?? '',
  }
}

export function updatePublicCardsFilter<K extends keyof PublicCardsFilterState>(
  filters: PublicCardsFilterState,
  key: K,
  value: PublicCardsFilterState[K]
): PublicCardsFilterState {
  const next = { ...filters, [key]: value }

  if (key === 'stateId') {
    next.cityId = null
  }

  return next
}
