import type { ApiResponse } from '@/interfaces/api/api.interface'

export type ClientReviewLink = {
  url: string | null
  has_link: boolean
}

export type ClientItem = {
  id: number | string
  title: string
  description: string | null
  post_type_id: number
  created_at: string
  status: number | string
  featured_image: string | { url?: string } | Array<{ url?: string }> | null
  attachments?: Array<{ url?: string | null }>
  review_link: ClientReviewLink
  general_info_url?: string | null
  url?: string | null
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
  id: number | string
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
