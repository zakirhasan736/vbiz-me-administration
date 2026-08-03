/** Written brand (display). */
export const VBIZ_ME_DISPLAY_BRAND = 'vBiz Me'

/**
 * Phonetic TTS spelling — "Veebiz" = letter V + biz, "Me" = me.
 * Avoids TTS reading "Vbiz" as "viz". Sounds like vBiz Me (vee-biz-me) as ONE smooth name.
 */
export const VBIZ_ME_SPOKEN_BRAND = 'Veebiz Me'

export const VBIZ_ME_GREETING_TRIGGER = 'The user has just opened the site...'

export function isVbizMeBrand(company: string): boolean {
  const norm = company
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return norm === 'vbizme' || norm === 'vbiz'
}

/** Spoken form for TTS — vBiz Me uses phonetic spelling; other companies use trimmed display name. */
export function spokenCompanyName(company: string): string {
  return isVbizMeBrand(company) ? VBIZ_ME_SPOKEN_BRAND : company.trim()
}

export function buildGreetingText(company: string): string {
  const spoken = spokenCompanyName(company)
  return `Welcome to ${spoken}! How can I help you? I can offer a quick guided tour of the card if you'd like.`
}

/** @deprecated Use buildGreetingText('vBiz Me') — kept for imports. */
export const VBIZ_ME_GREETING_TEXT = buildGreetingText('vBiz Me')

const VBIZ_ME_PRONUNCIATION_RULES = `
The brand is written ${VBIZ_ME_DISPLAY_BRAND}. For every voice response, write the TTS form exactly as: ${VBIZ_ME_SPOKEN_BRAND}
That spelling is phonetic: Vee + biz + Me = vee-biz-me (the letter V, then Biz, then Me).

Say it as ONE smooth brand name — fluid and natural, with NO gaps, pauses, or slow syllable-by-syllable delivery.

NEVER pronounce it as:
* viz me, viz biz, or vibz (wrong — the V must sound like the letter V, not "viz")
* biv me, viv me, or vee biz me with awkward gaps
* biz me or Biz Me alone (drops the V)
* vibz, vibes, vibz me
* vBiz Me or Vbiz Me in spoken output (TTS misreads as "viz")
* robotic pauses between Vee, biz, and Me
`.trim()

export function buildVoicePronunciationBlock(company: string): string {
  const spoken = spokenCompanyName(company)
  const greetingText = buildGreetingText(company)

  const brandRules = isVbizMeBrand(company)
    ? VBIZ_ME_PRONUNCIATION_RULES
    : `
When saying the business name "${company.trim()}", pronounce it clearly for text-to-speech.
Write the spoken form exactly as: ${spoken}
Say the full business name smoothly — no skipped words, garbled syllables, or awkward pauses.
`.trim()

  return `
VOICE AND TTS PRONUNCIATION — BRAND NAME (CRITICAL)
========================================================

Your responses are spoken aloud through text-to-speech.

${brandRules}

The initial greeting MUST use this exact wording:
"${greetingText}"

Do not alter, shorten, or reword the greeting. The business name must be heard clearly and smoothly in the first sentence.

Apply the spoken form "${spoken}" every time you say this business or brand name in a voice response.
`.trim()
}

/** @deprecated Use buildVoicePronunciationBlock(company) */
export const VBIZ_ME_VOICE_PRONUNCIATION = buildVoicePronunciationBlock('vBiz Me')

const VBIZ_PRONUNCIATION_NOTE = ` CRITICAL: "${VBIZ_ME_SPOKEN_BRAND}" is phonetic for ${VBIZ_ME_DISPLAY_BRAND} — pronounce vee-biz-me as ONE smooth brand name (letter V + biz + me). NEVER say "viz me", "viz biz", "biv me", "biz me" alone, or "vibz". Do NOT insert pauses or gaps between syllables.`

/** Client turn on connect — forces exact greeting wording and pronunciation. */
export function buildLiveAgentGreetingIntroPrompt(company: string, langCode = 'en'): string {
  const trimmedCompany = company.trim() || 'vBiz Me'
  const greetingText = buildGreetingText(trimmedCompany)
  const pronunciationNote = isVbizMeBrand(trimmedCompany) ? VBIZ_PRONUNCIATION_NOTE : ''

  if (langCode && langCode !== 'en') {
    const brandNote = isVbizMeBrand(trimmedCompany)
      ? ` Keep ${VBIZ_ME_DISPLAY_BRAND} as the smooth spoken brand "${VBIZ_ME_SPOKEN_BRAND}" (vee-biz-me, no pauses).`
      : ` Pronounce the business name "${spokenCompanyName(trimmedCompany)}" clearly and smoothly.`
    return `${VBIZ_ME_GREETING_TRIGGER} Their preferred language is not English — translate the greeting naturally but${brandNote} Say the equivalent of: "${greetingText}" and offer a quick guided tour of the card.${pronunciationNote} Respond aloud with ONLY the greeting sentence — no meta-commentary.`
  }

  return `${VBIZ_ME_GREETING_TRIGGER} Speak aloud immediately. Your entire spoken response must be EXACTLY this greeting — word for word, do not rephrase, shorten, or add anything before or after: "${greetingText}"${pronunciationNote}`
}

export const BRAND_PRONUNCIATION_PRIORITY_OVERRIDE = `
PRIORITY OVERRIDE — BRAND PRONUNCIATION (ALWAYS WINS)
====================================================

If any earlier instruction conflicts with brand pronunciation, follow these rules:

* ${VBIZ_ME_DISPLAY_BRAND} is always spoken as "${VBIZ_ME_SPOKEN_BRAND}" — one smooth vee-biz-me name, never "viz me", "vibz", "biv me", or "biz me" alone.
* Do NOT use pauses, commas, or slow syllable-by-syllable delivery for the brand name.
* The first greeting after site open must match the exact greeting text in the system prompt — no substitutions.
* In every voice response, write the brand using the TTS-safe spoken form from the pronunciation block.
`.trim()
