'use client'

import { resolveCardOwnerId } from '@/lib/i18n/cardScope'
import { I18N_CONFIG, selectedLanguageStorageKey } from '@/lib/i18n/config'
import { useEffect, useState } from 'react'

export const LANGUAGE_CHANGE_EVENT = I18N_CONFIG.languageChangeEvent

/**
 * Lightweight hook for language state + English source strings.
 * All visible translation is handled by Google Website Translator (DOM).
 */
export function useTranslation() {
  const cardId = resolveCardOwnerId()
  const [lang, setLang] = useState<string>(() => {
    if (typeof window === 'undefined') return I18N_CONFIG.fallback
    return localStorage.getItem(selectedLanguageStorageKey(cardId)) || I18N_CONFIG.fallback
  })

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem(selectedLanguageStorageKey(cardId)) || I18N_CONFIG.fallback)
    }

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange)
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange)
  }, [cardId])

  /** English source text — Google Translate rewrites it in the rendered DOM. */
  const t = (_key: string, defaultValue: string): string => defaultValue

  return { t, lang, isLoading: false }
}
