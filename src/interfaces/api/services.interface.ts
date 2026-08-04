import type { ApiResponse } from '@/interfaces/api/api.interface'

export type ServiceReviewLink = {
  url: string | null
  has_link: boolean
}

export type ServiceItem = {
  id: number | string
  title: string
  description: string | null
  post_type_id?: number
  created_at?: string
  status: number
  /** Laravel: string URL. Node may send string or [{ url }]. */
  featured_image: string | null | Array<{ url?: string | null }> | { url?: string | null }
  review_link: ServiceReviewLink
}

export type ServicesSectionPostType = {
  name: string
  title: string
}

export type ServicesSectionData = {
  type: string
  postType: ServicesSectionPostType
  profile: { id: string }
  items: ServiceItem[]
}

export type ServicesSectionResponse = ApiResponse<ServicesSectionData> & {
  section_id?: string
  post_type?: {
    name: string
    title: string
    type_id?: string
  }
}

export type ServiceListItem = {
  id: number | string
  title: string
  description: string
  htmlDescription: string
  featuredImage: string
  url: string
}

export type ServicesQueryResult = {
  sectionTitle: string
  services: ServiceListItem[]
}
