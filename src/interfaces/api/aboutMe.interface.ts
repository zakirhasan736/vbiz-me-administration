import type { ApiResponse } from '@/interfaces/api/api.interface'

export type AboutMeAttachment = {
  id: number
  doc_name: string
  attachment_type_id: number
  url: string
}

export type AboutMeItem = {
  id: number
  title: string
  description: string | null
  profile_id: number
  post_type_id: number
  status: number | string
  created_at: string
  updated_at: string
  featured_image: string | null
  attachments?: AboutMeAttachment[]
}

export type AboutMeSectionPostType = {
  id?: number
  name: string
  title: string
}

export type AboutMeSectionData = {
  type: string
  postType: AboutMeSectionPostType
  profile: { id: string }
  items: AboutMeItem[]
}

export type AboutMeSectionResponse = ApiResponse<AboutMeSectionData> & {
  section_id?: string
  post_type?: {
    name: string
    title: string
    type_id?: string
  }
}

export type AboutMePillar = {
  title: string
  description: string
}

export type AboutMeHighlight = {
  title: string
  html: string
  plain: string
}

export type AboutMeFooter = {
  headline: string
  subheadline: string
  tagline: string
}

export type AboutMeListItem = {
  id: number
  title: string
  plainDescription: string
  htmlDescription: string
  introHtml: string
  featuredImage: string
  pillars: AboutMePillar[]
  highlight: AboutMeHighlight | null
  footer: AboutMeFooter | null
}

export type AboutMeQueryResult = {
  sectionTitle: string
  items: AboutMeListItem[]
}
