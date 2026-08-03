import type { ApiResponse } from '@/interfaces/api/api.interface'

export type MyCardProfile = {
  id: number
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  zipcode: string | null
  website: string | null
  company_name: string | null
  designation: string | null
  description: string | null
  profession: string | null
  gender: string | null
  marital_status: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
  tiktok: string | null
  youtube: string | null
  rumble: string | null
  truth: string | null
  linkedin: string | null
  pinterest: string | null
  whatsapp: string | null
}

export type MyCardMyInfoField = {
  enabled: boolean
  value: string
  icon?: string
  label?: string
  url?: string
  google_maps_url?: string
  tel_url?: string
  mailto_url?: string
}

export type MyCardMyInfoAdditionalField = {
  key: string
  value: string
  css_class?: string
  icon?: string
}

export type MyCardMediaBlock = {
  enabled?: boolean
  video_url?: string | null
  url?: string | null
  fallback_url?: string | null
  type?: string
  is_video?: boolean
  doc_name?: string
  extension?: string
  shape?: string
  show_intro_modal?: boolean
  has_regular_video?: boolean
  regular_video?: { url?: string | null; doc_name?: string; extension?: string; type?: string }
  youtube?: { embed_url?: string | null; link?: string | null; video_id?: string }
  controls?: { skip_button?: boolean; mute_button?: boolean }
}

export type MyCardActionButton = {
  enabled?: boolean
  label?: string
  icon?: string
  background_color?: string
  text_color?: string
  count?: number
  link?: string
  data?: Record<string, string>
}

export type MyCardActionButtons = {
  my_info?: MyCardActionButton
  save_contact?: MyCardActionButton
  share?: MyCardActionButton
  refresh?: MyCardActionButton
  language?: MyCardActionButton
  view_counter?: MyCardActionButton
  [key: string]: MyCardActionButton | undefined
}

export type MyCardMyInfo = {
  personal?: Record<string, MyCardMyInfoField>
  professional?: Record<string, MyCardMyInfoField>
  contact?: Record<string, MyCardMyInfoField>
  additional_fields?: MyCardMyInfoAdditionalField[]
}

export type MyCardBackgroundAudio = {
  enabled?: boolean
  use_youtube_link?: boolean
  url?: string
  doc_name?: string
  youtube?: { link?: string; video_id?: string; embed_url?: string }
  start_time?: string | number
  end_time?: string | number
  repeat?: boolean
}

/** Payload from `GET /v/{slug}` (Postman: MyCard). */
export type MyCardData = {
  profile: MyCardProfile
  settings: Record<string, string>
  features: Record<string, boolean | string | number>
  /** Active shell id from backend, e.g. "dynamic" (v1), "v2", "v3", or "default" (v3). */
  template: string
  background_media: MyCardMediaBlock
  intro_video: MyCardMediaBlock
  profile_media: MyCardMediaBlock
  action_buttons: MyCardActionButtons
  my_info: MyCardMyInfo
  background_audio?: MyCardBackgroundAudio
  /** Optional dynamic global theme (Primary/Secondary/Accent + button/social appearance). */
  theme_config?: unknown
}

export type MyCardResponse = ApiResponse<MyCardData>
