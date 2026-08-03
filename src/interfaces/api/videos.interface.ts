import type { ApiResponse } from '@/interfaces/api/api.interface'

export type VideoSectionPostType = {
  name: string
  title: string
  type_id?: string
}

export type VideoSectionImage = {
  id: number
  doc_name: string
  url: string
}

export type VideoSectionGallery = {
  images: VideoSectionImage[]
  total_images: number
} | null

export type VideoSectionItem = {
  title: string
  created_at: string
  type: string
  featured_image: VideoSectionImage | null
  gallery: VideoSectionGallery
  video?: { url?: string | null } | null
}

export type VideoSectionData = {
  type: string
  postType: {
    name: string
    title: string
  }
  items: VideoSectionItem[]
}

export type VideoSectionResponse = ApiResponse<VideoSectionData> & {
  section_id?: string
  post_type?: VideoSectionPostType
}

export type VideoListItem = {
  id: string
  title: string
  type: string
  createdAt: string
  featuredImage: string
  galleryCount: number
  galleryImages: string[]
}

export type VideosQueryResult = {
  sectionTitle: string
  items: VideoListItem[]
}
