import type { ApiResponse } from '@/interfaces/api/api.interface'

export type ClientReviewLink = {
  url: string | null
  has_link: boolean
}

export type ClientItem = {
  id: number
  title: string
  description: string | null
  post_type_id: number
  created_at: string
  status: number
  featured_image: string | null
  review_link: ClientReviewLink
}

export type ClientsSectionPostType = {
  name: string
  title: string
}

export type ClientsSectionData = {
  type: string
  postType: ClientsSectionPostType
  profile: { id: string }
  items: ClientItem[]
}

export type ClientsSectionResponse = ApiResponse<ClientsSectionData> & {
  section_id?: string
  post_type?: {
    name: string
    title: string
    type_id?: string
  }
}

export type ClientListItem = {
  id: number
  name: string
  logo: string
  since: string
  description: string
  linkUrl: string | null
}

export type ClientsQueryResult = {
  sectionTitle: string
  clients: ClientListItem[]
}
