import type { ApiResponse } from '@/interfaces/api/api.interface'

export type ReviewLink = {
  url: string | null
  has_link: boolean
}

export type ReviewItem = {
  id: string | number
  /** Current reviews API fields. */
  author?: string | null
  text?: string | null
  imageUrl?: string | null
  reviewUrl?: string | null
  sortOrder?: number | null
  /** Legacy dynamic-section fields. */
  title?: string | null
  description?: string | null
  post_type_id?: number
  created_at?: string
  status?: number | string | boolean | null
  featured_image?: string | { url?: string } | Array<{ url?: string }> | null
  review_link?: ReviewLink | null
  rating?: number | null
  general_info_url?: string | null
}

export type ReviewsSectionPostType = {
  name: string
  title: string
}

export type ReviewsSectionData = {
  type?: string
  postType?: ReviewsSectionPostType
  profile?: { id: string }
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
  id: string | number
  title: string
  plainDescription: string
  htmlDescription: string
  image: string
  linkUrl: string | null
  isLinkCard: boolean
  rating: number
}

export type ReviewsQueryResult = {
  sectionTitle: string
  slides: ReviewListItem[]
  leaveReviewUrl: string | null
  reviewCount: number
  averageRating: number
}
