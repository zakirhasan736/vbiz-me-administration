import type { ApiResponse } from '@/interfaces/api/api.interface'

export type GalleryImageAsset = {
  id: string | number
  doc_name: string
  url: string
}

export type GalleryItem = {
  id?: string | number
  title: string
  created_at?: string
  type?: string
  featured_image: GalleryImageAsset | GalleryImageAsset[] | string | null
  gallery?: GalleryImageAsset[] | null
  attachments?: Array<{ id?: string | number; doc_name?: string; url?: string }> | null
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

export type GalleryListItem = {
  id: string | number
  title: string
  imageUrl: string
  createdAt: string
}

export type GalleryQueryResult = {
  sectionTitle: string
  items: GalleryListItem[]
}
