import type { ApiResponse } from '@/interfaces/api/api.interface'

export type ServiceReviewLink = {
  url: string | null
  has_link: boolean
}

export type ServiceItem = {
  id: number
  title: string
  description: string | null
  post_type_id: number
  created_at: string
  status: number
  featured_image: string | null
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
  id: number
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
