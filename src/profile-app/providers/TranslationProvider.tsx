'use client'

import { setTranslationCardScope } from '@/lib/i18n/cardScope'
import { initTranslation, maybeResetTranslationForNewCard } from '@/lib/i18n/translation'
import { LanguageModal } from '@/profile-app/components/LanguageModal'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type TranslationUiContextValue = {
  openLanguageModal: () => void
  closeLanguageModal: () => void
  isLanguageModalOpen: boolean
}

const TranslationUiContext = createContext<TranslationUiContextValue | null>(null)

export function TranslationProvider({
  cardOwnerId,
  profileSlug,
  theme = 'light',
  children,
}: {
  cardOwnerId?: string
  profileSlug?: string
  theme?: 'light' | 'dark'
  children: ReactNode
}) {
  const [languageModalOpen, setLanguageModalOpen] = useState(false)

  useEffect(() => {
    const cardKey = cardOwnerId ?? profileSlug ?? null
    setTranslationCardScope(cardKey)
    // Switching to a different card with no saved language resets any leftover
    // translation to English (one clean reload). Skip init if a reload fired.
    if (maybeResetTranslationForNewCard(cardKey)) return
    void initTranslation()
  }, [cardOwnerId, profileSlug])

  const openLanguageModal = useCallback(() => setLanguageModalOpen(true), [])
  const closeLanguageModal = useCallback(() => setLanguageModalOpen(false), [])

  const value = useMemo(
    () => ({
      openLanguageModal,
      closeLanguageModal,
      isLanguageModalOpen: languageModalOpen,
    }),
    [closeLanguageModal, languageModalOpen, openLanguageModal]
  )

  return (
    <TranslationUiContext.Provider value={value}>
      {/* Google Translate host is created off-screen by the early bootstrap / runtime
          (see googleTranslateRuntime). Rendering it here as display:none collided with
          the bootstrap host (duplicate id) and stopped the combo from mounting. */}
      {children}
      <LanguageModal isOpen={languageModalOpen} onClose={closeLanguageModal} theme={theme} />
    </TranslationUiContext.Provider>
  )
}

export function useTranslationUi() {
  const ctx = useContext(TranslationUiContext)
  if (!ctx) {
    throw new Error('useTranslationUi must be used within TranslationProvider')
  }
  return ctx
}

/** Optional hook — returns no-op open when provider is absent (embedded previews). */
export function useOptionalTranslationUi() {
  return useContext(TranslationUiContext)
}
