import { buildSystemPrompt } from '@/lib/liveAgent/languagePrompt'
import type { ProfileAiData } from '@interfaces/api/profileAiData'

export type LiveAgentCardData = ProfileAiData

const EMPTY_SOCIALS: LiveAgentCardData['socials'] = {
  facebook: null,
  instagram: null,
  twitter: null,
  linkedin: null,
  youtube: null,
  tiktok: null,
  rumble: null,
  truth: null,
}

export const DEFAULT_LIVE_AGENT_CARD: LiveAgentCardData = {
  profileId: '',
  slug: '',
  ownerName: '',
  title: '',
  profession: null,
  company: '',
  email: '',
  phone: '',
  whatsapp: '',
  website: '',
  location: '',
  about: '',
  socials: EMPTY_SOCIALS,
  skills: [],
  services: [],
  experience: [],
  education: [],
  portfolio: [],
  customSections: [],
  reviews: [],
  blogs: [],
  faqs: [],
  assistantContext: { businessBrief: '', knowledge: [] },
}

/** Server + client system prompt. */
export function buildLiveAgentSystemPrompt(cardData: LiveAgentCardData): string {
  return buildSystemPrompt(cardData)
}
