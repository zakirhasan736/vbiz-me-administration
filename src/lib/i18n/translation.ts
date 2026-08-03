/**
 * Translation Utility using Google Website Translator
 * Central module — shared across v1, v2, v3 profile templates.
 *
 * Language changes always trigger a full page reload. The `googtrans` cookie
 * (set before reload) makes Google Translate apply the target language during load.
 */

import { resolveCardOwnerId, setTranslationCardScope } from '@/lib/i18n/cardScope'
import {
  buildTranslationConfig,
  I18N_CONFIG,
  selectedLanguageStorageKey,
  translationConfigCacheKey,
  type BackendLanguage,
  type TranslationConfig,
} from '@/lib/i18n/config'
import { ensureGoogleTranslateLoaded, resetGoogleTranslateRuntime } from '@/lib/i18n/googleTranslateRuntime'
import { injectTranslateStyles } from '@/lib/i18n/translateDomStyles'
import {
  buildGoogleTransCookieValue,
  clearGoogleTransCookies,
  googleTranslateCookieValueKey,
  persistLanguageChoice,
  readPersistedGoogleTransValue,
  readPersistedLanguage,
  reloadForTranslation,
  setGoogleTransCookie,
} from '@/lib/i18n/translationPersistence'

export { LANG_CODE_MAP as langCodeMap, LANGUAGE_LABELS } from '@/lib/i18n/config'
export { injectTranslateStyles, setTranslationCardScope }
export type { BackendLanguage, TranslationConfig }

/** @deprecated Use resolveCardOwnerId from cardScope — kept for v3 component compatibility. */
export function getCardOwnerId(): string {
  return resolveCardOwnerId()
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: unknown
  }
}

export function getAllCookies(name: string): string[] {
  if (typeof document === 'undefined') return []
  const allCookies = document.cookie.split(';')
  const matchingCookies: string[] = []
  for (let cookie of allCookies) {
    cookie = cookie.trim()
    if (cookie.toLowerCase().startsWith(name.toLowerCase() + '=')) {
      matchingCookies.push(cookie)
    }
  }
  return matchingCookies
}

function cleanupGoogleTranslateDom() {
  document.body.classList.remove('translated-ltr', 'translated-rtl')
  const googElements = document.querySelectorAll('[class*="goog"]')
  googElements.forEach((el) => {
    if (el.id !== I18N_CONFIG.googleTranslateElementId && !el.classList.contains('skiptranslate')) {
      el.remove()
    }
  })
}

function parseGoogTransLanguage(cookieValue: string, fallback: string): string | null {
  if (!cookieValue.startsWith(`/${fallback}/`)) return null
  const langCode = cookieValue.split('/')[2]
  return langCode && langCode !== fallback ? langCode : null
}

function resolveLanguageToApply(cardId: string, fallback: string): string {
  const savedLanguage = readPersistedLanguage(cardId, fallback)
  const persistedCookie = readPersistedGoogleTransValue(cardId)

  if (savedLanguage === fallback) {
    return fallback
  }

  if (persistedCookie) {
    return savedLanguage
  }

  const allGoogtransCookies = getAllCookies('googtrans')
  for (const cookie of allGoogtransCookies) {
    const parts = cookie.trim().split('=')
    if (parts.length >= 2) {
      const val = parts.slice(1).join('=')
      const fromCookie = parseGoogTransLanguage(val, fallback)
      if (fromCookie) {
        localStorage.setItem(selectedLanguageStorageKey(cardId), fromCookie)
        return fromCookie
      }
    }
  }

  return savedLanguage
}

let activeTranslationConfig: TranslationConfig = buildTranslationConfig()

export function getActiveTranslationConfig(): TranslationConfig {
  return activeTranslationConfig
}

/** Brief wait cursor while the browser navigates to the reloaded page. */
function beginTranslateSwitching() {
  if (typeof document === 'undefined') return
  document.body.classList.add('vbiz-translate-switching')
}

/** Persist language + googtrans cookie, then reload so Google translates during load. */
function commitLanguageAndReload(langCode: string, fallback: string) {
  const cardId = resolveCardOwnerId()

  persistLanguageChoice(cardId, langCode, fallback)
  clearGoogleTransCookies()

  if (langCode !== fallback) {
    const cookieValue = buildGoogleTransCookieValue(langCode, fallback)
    setGoogleTransCookie(cookieValue)
  }

  beginTranslateSwitching()
  window.setTimeout(reloadForTranslation, 50)
}

/** Reset to English and reload the page. */
export function resetToEnglish() {
  const cardId = resolveCardOwnerId()
  const fallback = I18N_CONFIG.fallback

  persistLanguageChoice(cardId, fallback, fallback)
  clearGoogleTransCookies()
  cleanupGoogleTranslateDom()
  resetGoogleTranslateRuntime()

  beginTranslateSwitching()
  window.setTimeout(reloadForTranslation, 50)
}

export function applyTranslationConfigToDOM(config: TranslationConfig) {
  activeTranslationConfig = config
  const cardId = resolveCardOwnerId()
  const fallback = config.fallback || I18N_CONFIG.fallback

  injectTranslateStyles()

  const languageToUse = resolveLanguageToApply(cardId, fallback)
  const persistedCookie = readPersistedGoogleTransValue(cardId)

  if (languageToUse !== fallback) {
    const cookieValue = persistedCookie || buildGoogleTransCookieValue(languageToUse, fallback)
    setGoogleTransCookie(cookieValue)
    if (!persistedCookie) {
      localStorage.setItem(googleTranslateCookieValueKey(cardId), cookieValue)
    }

    // After reload, mount the widget so Google finishes translating the page.
    void ensureGoogleTranslateLoaded(config, languageToUse)
    return
  }

  clearGoogleTransCookies()
  cleanupGoogleTranslateDom()
}

export async function initTranslation(): Promise<TranslationConfig> {
  const cardId = resolveCardOwnerId()
  const configCacheKey = translationConfigCacheKey(cardId)

  let cachedConfig: TranslationConfig | null = null
  try {
    const cachedStr = localStorage.getItem(configCacheKey)
    if (cachedStr) {
      cachedConfig = JSON.parse(cachedStr)
    }
  } catch (e) {
    console.error('Failed to parse cached translation config:', e)
  }

  const fetchAndUpdateConfig = async (): Promise<TranslationConfig> => {
    const res = await fetch(I18N_CONFIG.languagesApiPath)
    if (!res.ok) {
      throw new Error('Failed to fetch languages configuration')
    }
    const config: TranslationConfig = await res.json()
    localStorage.setItem(configCacheKey, JSON.stringify(config))
    return config
  }

  if (cachedConfig) {
    applyTranslationConfigToDOM(cachedConfig)
    void fetchAndUpdateConfig().catch((err) => {
      console.warn('Background config refresh failed:', err)
    })
    return cachedConfig
  }

  try {
    const config = await fetchAndUpdateConfig()
    applyTranslationConfigToDOM(config)
    return config
  } catch (error) {
    console.error('initTranslation error, using fallback:', error)
    const fallbackConfig = buildTranslationConfig()
    applyTranslationConfigToDOM(fallbackConfig)
    return fallbackConfig
  }
}

/**
 * Apply a language choice: save preference, set googtrans cookie, reload the tab.
 * Google Website Translator applies the target language during the reload.
 */
export function applyTranslation(langCode: string, fallback: string = I18N_CONFIG.fallback) {
  const cardId = resolveCardOwnerId()
  const current = readPersistedLanguage(cardId, fallback)

  if (langCode === current) {
    window.dispatchEvent(new Event(I18N_CONFIG.languageChangeEvent))
    return true
  }

  commitLanguageAndReload(langCode, fallback)
  return false
}

/** Read the active language for the current card (from localStorage). */
export function getActiveLanguage(fallback: string = I18N_CONFIG.fallback): string {
  return readPersistedLanguage(resolveCardOwnerId(), fallback)
}

/** Tracks the last card we scoped to so we can detect a soft-nav card switch. */
let lastScopedCardKey: string | null = null

function urlSlug(): string | null {
  if (typeof window === 'undefined') return null
  const match = window.location.pathname.match(/^\/([^/]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

/** True when this card has an explicit, non-English saved language preference. */
function cardHasExplicitLanguage(cardKey: string | null, fallback: string): boolean {
  const candidates = [cardKey, urlSlug()].filter((value): value is string => Boolean(value))
  return candidates.some((key) => {
    const saved = readPersistedLanguage(key, fallback)
    return Boolean(saved) && saved !== fallback
  })
}

/** A translation is currently rendered on screen (leftover from a previous card). */
function hasActiveTranslation(): boolean {
  if (typeof document === 'undefined') return false
  if (getAllCookies('googtrans').length > 0) return true
  return document.body.classList.contains('translated-ltr') || document.body.classList.contains('translated-rtl')
}

/**
 * Reset translation to English when navigating (soft-nav) to a *different* card
 * that has no explicit language choice. The `googtrans` cookie + Google Translate
 * engine persist across client-side navigations, so a previously translated card
 * leaves the next card translated on screen while its AI agent speaks English.
 * A single clean reload guarantees both the screen and the agent are in English.
 *
 * Returns true when a reset reload was triggered (caller should stop init).
 */
export function maybeResetTranslationForNewCard(cardKey: string | null): boolean {
  if (typeof window === 'undefined') return false

  const previous = lastScopedCardKey
  lastScopedCardKey = cardKey

  // First mount (full page load) or same card → nothing to reset.
  // (After our reload the module re-initializes, so `previous` is null and we
  // never loop.)
  if (previous === null || !cardKey || previous === cardKey) return false

  const fallback = I18N_CONFIG.fallback

  // Respect a card that the user explicitly set to a non-English language.
  if (cardHasExplicitLanguage(cardKey, fallback)) return false

  // Only reload if a stale translation is actually active.
  if (!hasActiveTranslation()) return false

  clearGoogleTransCookies()
  reloadForTranslation()
  return true
}
