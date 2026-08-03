import { IApiResponse } from '@/interfaces/api/api.interface'

export type StaticNavLink = {
  id: string
  title: string
  name: string
  post_type: string | null
  active: boolean
}

export type PostTypeNavLink = {
  id: number
  name: string
  title: string
  status: string
  type_id: string
  /** Optional URL slug from `/post-types?profile_id=` (e.g. "licensing"). */
  slug?: string
}

export interface NavBarLinksData {
  StaticLink?: StaticNavLink[]
  post_types?: PostTypeNavLink[]
}

export type NavBarLinksResponse = IApiResponse<NavBarLinksData>
