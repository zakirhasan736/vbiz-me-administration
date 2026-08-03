'use client'

import { useOptionalTranslationUi } from '@/profile-app/providers/TranslationProvider'
import { Languages } from 'lucide-react'

type ProfileLanguageButtonProps = {
  className?: string
  label?: string
  /** Called when no TranslationProvider is mounted (fallback). */
  onFallbackClick?: () => void
}

/** Shared language toggle — opens central LanguageModal when TranslationProvider is active. */
export function ProfileLanguageButton({
  className = '',
  label = 'Language',
  onFallbackClick,
}: ProfileLanguageButtonProps) {
  const translationUi = useOptionalTranslationUi()

  const handleClick = () => {
    if (translationUi) {
      translationUi.openLanguageModal()
      return
    }
    onFallbackClick?.()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 ${className}`}
    >
      <Languages size={18} />
    </button>
  )
}
