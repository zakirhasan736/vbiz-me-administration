import type { ApiResponse } from '@/interfaces/api/api.interface'

export type ReviewLink = {
  url: string | null
  has_link: boolean
}

export type ReviewItem = {
  id: number
  title: string
  description: string | null
  post_type_id: number
  created_at: string
  status: number
  featured_image: string | null
  review_link: ReviewLink
}

export type ReviewsSectionPostType = {
  name: string
  title: string
}

export type ReviewsSectionData = {
  type: string
  postType: ReviewsSectionPostType
  profile: { id: string }
  items: ReviewItem[]
}

export type ReviewsSectionResponse = ApiResponse<ReviewsSectionData> & {
  section_id?: string
  post_type?: {
    name: string
    title: string
    type_id?: string
  }
}

export type ReviewListItem = {
  id: number
  title: string
  plainDescription: string
  htmlDescription: string
  image: string
  linkUrl: string | null
  isLinkCard: boolean
}

export type ReviewsQueryResult = {
  sectionTitle: string
  slides: ReviewListItem[]
  leaveReviewUrl: string | null
  reviewCount: number
}
