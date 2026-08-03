import { resolveCardOwnerId } from '@/lib/i18n/cardScope'
import { LANGUAGE_NAMES, translationsCacheKey } from '@/lib/i18n/config'
import {
  BRAND_PRONUNCIATION_PRIORITY_OVERRIDE,
  buildGreetingText,
  buildLiveAgentGreetingIntroPrompt,
  buildVoicePronunciationBlock,
  spokenCompanyName,
} from '@/lib/liveAgent/brandPronunciation'
import { SYSTEM_PROMPT_TEMPLATE } from '@/lib/liveAgent/systemPromptTemplate'
import type { LiveAgentCardData } from '@/profile-app/lib/liveAgentPrompt'

export function buildCardPayloadForPrompt(data: LiveAgentCardData): string {
  return JSON.stringify({
    ownerName: data.ownerName,
    title: data.title,
    company: data.company,
    email: data.email,
    phone: data.phone,
    website: data.website,
    location: data.location,
  })
}

export function buildSystemPrompt(data: LiveAgentCardData, override?: string): string {
  const company = data.company?.trim() || 'vBiz Me'
  const cardPayload = buildCardPayloadForPrompt(data)
  const greetingText = buildGreetingText(company)
  const spokenBrand = spokenCompanyName(company)

  const base = (override ?? SYSTEM_PROMPT_TEMPLATE)
    .replace('__CARD_DATA_PLACEHOLDER__', cardPayload)
    .replaceAll('__LIVE_AGENT_GREETING_TEXT__', greetingText)
    .replaceAll('__SPOKEN_BRAND_NAME__', spokenBrand)

  return `${base}\n\n${buildVoicePronunciationBlock(company)}\n\n${BRAND_PRONUNCIATION_PRIORITY_OVERRIDE}`
}

export function getLiveAgentSystemPromptForLanguage(
  langCode: string,
  data: LiveAgentCardData,
  override?: string
): string {
  const base = buildSystemPrompt(data, override)
  const langName = LANGUAGE_NAMES[langCode] || 'English'

  let translationContext = ''
  try {
    if (typeof window !== 'undefined') {
      const cardId = resolveCardOwnerId()
      const storageKey = translationsCacheKey(cardId, langCode)
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        translationContext = `\n\n[CARD TRANSLATIONS CONTEXT IN ${langName.toUpperCase()}]\nBelow are the exact professional translations of the elements rendered on the card. Refer to, use, and respect these exact terms, roles, and details when guiding users or discussing the card content to ensure perfect consistency:\n${cached}`
      }
    }
  } catch {
    /* ignore storage errors */
  }

  if (langCode && langCode !== 'en') {
    return `${base}${translationContext}

CRITICAL LANGUAGE REQUIREMENT:
The user has set their language preference to ${langName} (${langCode}).
You MUST understand and respond ENTIRELY in ${langName}.
Translate all your guides, greetings, responses, and questions into fluent and natural ${langName}.
Do not speak in English unless explicitly asked by the user. Ensure your tone, personality, and humor are natural and culturally appropriate in ${langName}.`
  }

  return `${base}${translationContext}`
}

export function getLiveAgentInitialPromptForLanguage(langCode: string, company = 'vBiz Me'): string {
  return buildLiveAgentGreetingIntroPrompt(company, langCode)
}

/**
 * Active language from the domain-wide `googtrans` cookie (format `/source/target`).
 * This persists across cards, so a newly opened card is already translated even
 * though its per-card `selectedLanguage_<id>` key is empty.
 */
function readGoogTransLanguage(): string | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('googtrans='))
  if (!cookie) return null

  const value = decodeURIComponent(cookie.split('=').slice(1).join('='))
  const target = value.split('/')[2]
  return target && target !== 'en' ? target : null
}

export function getSelectedLanguageForLiveAgent(cardId?: string): string {
  if (typeof window === 'undefined') return 'en'
  const id = cardId ?? resolveCardOwnerId()

  // Per-card explicit choice wins (non-English).
  const stored = localStorage.getItem(`selectedLanguage_${id}`)
  if (stored && stored !== 'en') return stored

  // Otherwise follow the site-wide Google translation actually shown on screen.
  return readGoogTransLanguage() || stored || 'en'
}
