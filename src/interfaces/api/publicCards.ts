import type { ApiResponse } from '@/interfaces/api/api.interface'

export type PublicCard = {
  id: number
  name: string
  slug: string
  profession: string | null
  profession_id: number | null
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
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: PublicCardsPaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type PublicCardsFilterOption = {
  id: number
  name: string
}

export type PublicCardsDropdowns = {
  states?: PublicCardsFilterOption[]
  cities?: PublicCardsFilterOption[]
  professions?: PublicCardsFilterOption[]
}

/** Active filters echoed when searching (Postman: Public Card Search). */
export type PublicCardsFiltersApplied = {
  state_id?: string
  city_id?: string
  profession_id?: string
  service?: string
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
  state_id?: number
  city_id?: number
  profession_id?: number
  service?: string
  search?: string
}

/** Full API response from `GET /public-cards`. */
export type PublicCardsResponse = ApiResponse<PublicCardsPaginatedData> & {
  dropdowns?: PublicCardsDropdowns
  filters_applied?: PublicCardsFiltersApplied
  pagination?: PublicCardsPaginationMeta
}

/** Normalized result consumed by UI / RTK Query transforms. */
export type PublicCardsQueryResult = {
  cards: PublicCard[]
  pagination: PublicCardsPaginatedData
  filtersApplied?: PublicCardsFiltersApplied
  dropdowns?: PublicCardsDropdowns
}
