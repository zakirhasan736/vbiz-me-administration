import type { ApiResponse } from '@/interfaces/api/api.interface'

export type GalleryImageAsset = {
  id: number
  doc_name: string
  url: string
}

export type GalleryItem = {
  title: string
  created_at: string
  type: string
  featured_image: GalleryImageAsset | null
  gallery: GalleryImageAsset[] | null
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
  id: number
  title: string
  imageUrl: string
  createdAt: string
}

export type GalleryQueryResult = {
  sectionTitle: string
  items: GalleryListItem[]
}
