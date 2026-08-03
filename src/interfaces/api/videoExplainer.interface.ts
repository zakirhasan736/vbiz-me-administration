import type { ApiResponse } from '@/interfaces/api/api.interface'

export type VideoExplainerVideo = {
  doc_name: string
  url: string
}

export type VideoExplainerExternalUrl = {
  url: string | null
  has_external_url: boolean
}

export type VideoExplainerSectionData = {
  type: string
  video: VideoExplainerVideo
  external_url: VideoExplainerExternalUrl
}

export type VideoExplainerSectionResponse = ApiResponse<VideoExplainerSectionData> & {
  section_id?: string
  post_type?: {
    name: string
    title: string
    type_id?: string
  }
}

export type VideoExplainerQueryResult = {
  sectionTitle: string
  videoUrl: string
  videoName: string
  externalUrl: string | null
}
