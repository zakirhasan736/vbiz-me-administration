import type { ApiResponse } from '@/interfaces/api/api.interface'

/** Card id may be a Laravel int or vbiz Express cuid string. */
export type PublicCardId = string | number

export type PublicCard = {
  id: PublicCardId
  name: string
  slug: string
  profession: string | null
  profession_id: PublicCardId | null
  image: string
  image_type: string
  is_video: boolean
  profile_url: string
}

export type PublicCardsPaginationLink = {
  url: string | null
  label: string
  active: boolean
}

/** Paginated list inside `GET /public-cards` → `data`. */
export type PublicCardsPaginatedData = {
  current_page: number
  data: PublicCard[]
  first_page_url?: string
  from?: number | null
  last_page: number
  last_page_url?: string
  links?: PublicCardsPaginationLink[]
  next_page_url?: string | null
  path?: string
  per_page: number
  prev_page_url?: string | null
  to?: number | null
  total: number
}

export type PublicCardsFilterOption = {
  id: PublicCardId
  name: string
}

export type PublicCardsDropdowns = {
  states?: PublicCardsFilterOption[]
  cities?: PublicCardsFilterOption[]
  professions?: PublicCardsFilterOption[]
}

/** Active filters echoed when searching (Postman: Public Card Search). */
export type PublicCardsFiltersApplied = {
  state_id?: string | null
  city_id?: string | null
  profession_id?: string | null
  service?: string | null
}

export type PublicCardsPaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
  prev_page_url: string | null
}

export type PublicCardsSearchParams = {
  page?: number
  per_page?: number
  state_id?: PublicCardId
  city_id?: PublicCardId
  profession_id?: PublicCardId
  service?: string
  search?: string
}

/** Full API response from `GET /public-cards`. */
export type PublicCardsResponse = ApiResponse<PublicCardsPaginatedData> & {
  dropdowns?: PublicCardsDropdowns
  filters_applied?: PublicCardsFiltersApplied
  pagination?: PublicCardsPaginationMeta
  error?: string
}

/** Normalized result consumed by UI / RTK Query transforms. */
export type PublicCardsQueryResult = {
  cards: PublicCard[]
  pagination: PublicCardsPaginatedData
  filtersApplied?: PublicCardsFiltersApplied
  dropdowns?: PublicCardsDropdowns
}
