import type { ApiResponse } from '@/interfaces/api/api.interface'

export type DynamicPostAttachment = {
  id: number | string
  doc_name: string
  attachment_type_id: number
  url: string
}

export type DynamicPostFeaturedImage =
  | string
  | {
      id?: number | string
      doc_name?: string
      url?: string
    }
  | null

export type DynamicPostItem = {
  id?: number | string
  title?: string
  description?: string | null
  profile_id?: number | string
  post_type_id?: number | string
  status?: string | number | null
  created_at?: string
  updated_at?: string
  issuer?: string | null
  year?: string | number | null
  featured_image?: DynamicPostFeaturedImage
  general_info_url?: string | null
  url?: string | null
  video_url?: string | null
  external_url?: string | { url?: string | null } | null
  review_link?: { url?: string | null } | null
  attachments?: DynamicPostAttachment[]
  metas?: Record<string, string | null | undefined>
  type?: string
}

export type DynamicPostsSectionPostType = {
  id?: number | string
  name: string
  title: string
}

export type DynamicPostsSectionData = {
  type: string
  postType: DynamicPostsSectionPostType
  profile: { id: string }
  items: DynamicPostItem[]
}

export type DynamicPostsSectionResponse = ApiResponse<DynamicPostsSectionData> & {
  section_id?: string
  post_type?: {
    name: string
    title: string
    type_id?: string
  }
}

export type DynamicPostListItem = {
  id: number | string
  title: string
  description: string
  featuredImage: string
  generalInfoUrl: string
  date: string
  issuer: string
  year: string
  attachments: DynamicPostAttachment[]
}

export type DynamicPostsQueryResult = {
  sectionTitle: string
  posts: DynamicPostListItem[]
}
