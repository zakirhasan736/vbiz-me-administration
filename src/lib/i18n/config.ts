/** Central i18n / Google Translate configuration shared across all profile templates. */

export type BackendLanguage = {
  code: string
  flagCode: string
  name: string
}

export type TranslationConfig = {
  fallback: string
  scriptUrl: string
  languages: BackendLanguage[]
}

export const I18N_CONFIG = {
  fallback: 'en',
  scriptUrl: 'https://translate.google.com/translate_a/element.js',
  languagesApiPath: '/api/languages',
  languageChangeEvent: 'vbiz_language_changed',
  googleTranslateElementId: 'google_translate_element',
} as const

export const LANGUAGE_MAP: Record<string, { flagCode: string; name: string }> = {
  en: { flagCode: 'US', name: 'American English' },
  es: { flagCode: 'ES', name: 'Spanish' },
  fr: { flagCode: 'FR', name: 'French' },
  de: { flagCode: 'DE', name: 'German' },
  it: { flagCode: 'IT', name: 'Italian' },
  pt: { flagCode: 'PT', name: 'Portuguese' },
  ru: { flagCode: 'RU', name: 'Russian' },
  ja: { flagCode: 'JP', name: 'Japanese' },
  ko: { flagCode: 'KR', name: 'Korean' },
  'zh-CN': { flagCode: 'CN', name: 'Chinese (Simplified)' },
  ar: { flagCode: 'SA', name: 'Arabic' },
  hi: { flagCode: 'IN', name: 'Hindi' },
  ur: { flagCode: 'PK', name: 'Urdu' },
  pl: { flagCode: 'PL', name: 'Polish' },
  vi: { flagCode: 'VN', name: 'Vietnamese' },
}

export const LANGUAGE_LABELS: Record<string, { label: string; flag: string }> = {
  en: { label: 'American English', flag: '🇺🇸' },
  es: { label: 'Spanish', flag: '🇪🇸' },
  fr: { label: 'French', flag: '🇫🇷' },
  de: { label: 'German', flag: '🇩🇪' },
  it: { label: 'Italian', flag: '🇮🇹' },
  pt: { label: 'Portuguese', flag: '🇵🇹' },
  ru: { label: 'Russian', flag: '🇷🇺' },
  ja: { label: 'Japanese', flag: '🇯🇵' },
  ko: { label: 'Korean', flag: '🇰🇷' },
  'zh-CN': { label: 'Chinese (Simplified)', flag: '🇨🇳' },
  ar: { label: 'Arabic', flag: '🇸🇦' },
  hi: { label: 'Hindi', flag: '🇮🇳' },
  ur: { label: 'Urdu', flag: '🇵🇰' },
  pl: { label: 'Polish', flag: '🇵🇱' },
  vi: { label: 'Vietnamese', flag: '🇻🇳' },
}

const FLAGCDN_PNG_WIDTHS = [20, 40, 80, 160, 320] as const

/** ISO country → flag image (flagcdn). Snap to sizes the CDN actually serves. */
export function languageFlagImageUrl(flagCode: string, width = 40): string {
  const code = flagCode.trim().toLowerCase() || 'us'
  const snapped = FLAGCDN_PNG_WIDTHS.find((size) => size >= width) ?? FLAGCDN_PNG_WIDTHS[FLAGCDN_PNG_WIDTHS.length - 1]
  return `https://flagcdn.com/w${snapped}/${code}.png`
}

export function languageFlagSvgUrl(flagCode: string): string {
  const code = flagCode.trim().toLowerCase() || 'us'
  return `https://flagcdn.com/${code}.svg`
}

export function languageFlagCodeForLang(langCode: string): string {
  return LANGUAGE_MAP[langCode]?.flagCode || LANGUAGE_MAP.en.flagCode
}

export function languageDisplayName(langCode: string): string {
  return LANGUAGE_MAP[langCode]?.name || LANGUAGE_MAP.en.name
}

export function languageEmojiFlag(langCode?: string, flagCode?: string): string {
  if (langCode && LANGUAGE_LABELS[langCode]?.flag) return LANGUAGE_LABELS[langCode].flag
  const country = flagCode?.trim().toUpperCase()
  if (country) {
    const match = Object.entries(LANGUAGE_MAP).find(([, meta]) => meta.flagCode === country)?.[0]
    if (match && LANGUAGE_LABELS[match]?.flag) return LANGUAGE_LABELS[match].flag
  }
  return LANGUAGE_LABELS.en.flag
}

export const LANG_CODE_MAP: Record<string, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  ru: 'ru',
  ja: 'ja',
  ko: 'ko',
  'zh-CN': 'zh-CN',
  ar: 'ar',
  hi: 'hi',
  ur: 'ur',
  pl: 'pl',
  vi: 'vi',
}

export const FALLBACK_LANGUAGES: BackendLanguage[] = Object.entries(LANGUAGE_MAP).map(([code, meta]) => ({
  code,
  flagCode: meta.flagCode,
  name: meta.name,
}))

export const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_MAP).map(([code, meta]) => [code, meta.name])
)

export function buildTranslationConfig(): TranslationConfig {
  return {
    fallback: I18N_CONFIG.fallback,
    scriptUrl: I18N_CONFIG.scriptUrl,
    languages: FALLBACK_LANGUAGES,
  }
}

export function selectedLanguageStorageKey(cardId: string) {
  return `selectedLanguage_${cardId}`
}

export function translationsCacheKey(cardId: string, lang: string) {
  return `translations_${cardId}_${lang}`
}

export function translationConfigCacheKey(cardId: string) {
  return `translation_config_schema_${cardId}`
}
