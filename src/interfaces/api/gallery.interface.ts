import type { ApiResponse } from '@/interfaces/api/api.interface'
import type { ProfileMediaFrame } from '@/lib/media/profileMediaFrame'

export type GalleryImageAsset = {
  id: string | number
  doc_name: string
  url: string
}

export type GalleryItem = {
  id?: string | number
  title: string
  description?: string | null
  created_at?: string
  type?: string
  featured_image: GalleryImageAsset | GalleryImageAsset[] | string | null
  gallery?: GalleryImageAsset[] | null
  general_info_url?: string | null
  url?: string | null
  media_frame?: unknown
}

export type GallerySectionPostType = {
  name: string
  title: string
}

export type GallerySectionData = {
  type: string
  postType: GallerySectionPostType
  items: GalleryItem[]
}

export type GallerySectionResponse = ApiResponse<GallerySectionData> & {
  section_id?: string
  post_type?: {
    name: string
    title: string
    type_id?: string
  }
}

export type GalleryMediaKind = 'image' | 'video' | 'audio' | 'document' | 'link'

export type GalleryListItem = {
  id: string | number
  title: string
  /** Plain text. Shown on the card when there is no image. */
  description?: string
  imageUrl: string
  mediaFrame?: ProfileMediaFrame | null
  createdAt: string
  mediaKind?: GalleryMediaKind
  linkUrl?: string
}

export type GalleryQueryResult = {
  sectionTitle: string
  items: GalleryListItem[]
}
