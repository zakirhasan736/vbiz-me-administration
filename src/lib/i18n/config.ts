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
  en: { flagCode: 'US', name: 'English (US)' },
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
  en: { label: 'EN', flag: '🇺🇸' },
  es: { label: 'ES', flag: '🇪🇸' },
  fr: { label: 'FR', flag: '🇫🇷' },
  de: { label: 'DE', flag: '🇩🇪' },
  it: { label: 'IT', flag: '🇮🇹' },
  pt: { label: 'PT', flag: '🇵🇹' },
  ru: { label: 'RU', flag: '🇷🇺' },
  ja: { label: 'JA', flag: '🇯🇵' },
  ko: { label: 'KO', flag: '🇰🇷' },
  'zh-CN': { label: 'ZH', flag: '🇨🇳' },
  ar: { label: 'AR', flag: '🇸🇦' },
  hi: { label: 'HI', flag: '🇮🇳' },
  ur: { label: 'UR', flag: '🇵🇰' },
  pl: { label: 'PL', flag: '🇵🇱' },
  vi: { label: 'VI', flag: '🇻🇳' },
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
