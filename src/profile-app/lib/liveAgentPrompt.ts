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
  slug: 'michaelangelo-casanova',
  ownerName: 'Michaelangelo Casanova',
  title: 'CEO & Founder',
  profession: null,
  company: 'vBiz Me',
  email: 'mcasanova@vbizme.com',
  phone: '(860) 770-9893',
  whatsapp: '(860) 770-9893',
  website: 'https://vbizme.com',
  location: 'New Britain, CT',
  about: '',
  socials: EMPTY_SOCIALS,
  skills: [],
  services: [],
  experience: [],
  education: [],
  portfolio: [],
  customSections: [],
}

/** Server + client system prompt. */
export function buildLiveAgentSystemPrompt(cardData: LiveAgentCardData): string {
  return buildSystemPrompt(cardData)
}
