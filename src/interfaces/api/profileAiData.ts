/** Payload from `GET /profile-ai-data/{profile_id}`. */
export type ProfileAiSocials = {
  facebook: string | null
  instagram: string | null
  twitter: string | null
  linkedin: string | null
  youtube: string | null
  tiktok: string | null
  rumble: string | null
  truth: string | null
}

export type ProfileAiService = {
  title: string
  description: string
}

export type ProfileAiEducation = {
  title: string
  institute: string
  from_date: string
  to_date: string | null
  current_status: number
}

export type ProfileAiExperience = {
  title?: string
  company?: string
  job_title?: string
  description?: string
  from_date?: string
  to_date?: string | null
  current_status?: number
}

export type ProfileAiPortfolio = {
  title: string
  description: string
  url: string | null
  status: number
}

export type ProfileAiCustomSection = {
  section: string
  title: string
  summary: string
  content: string
  date: string
}

export type ProfileAiSkillGroup = {
  category: string
  skills: string[]
}

export type ProfileAiAssistantContext = {
  businessBrief: string
  knowledge: string[]
}

export type ProfileAiData = {
  profileId: string
  slug: string
  ownerName: string
  title: string
  profession: string | null
  company: string
  email: string
  phone: string
  whatsapp: string
  website: string
  location: string
  about: string
  socials: ProfileAiSocials
  skills: ProfileAiSkillGroup[]
  services: ProfileAiService[]
  experience: ProfileAiExperience[]
  education: ProfileAiEducation[]
  portfolio: ProfileAiPortfolio[]
  customSections: ProfileAiCustomSection[]
  reviews: unknown[]
  blogs: unknown[]
  faqs: unknown[]
  assistantContext: ProfileAiAssistantContext
}
