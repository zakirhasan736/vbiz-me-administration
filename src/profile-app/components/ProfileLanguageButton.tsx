'use client'

import { displayIconChromeStyle } from '@/lib/vcardDisplaySettings'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
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
  const { isVisible, field } = useProfileDisplay()

  if (!isVisible('Language')) return null

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
      className={`vbiz-icon-btn inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 ${className}`}
      style={displayIconChromeStyle(field('Language'))}
    >
      <Languages size={18} />
    </button>
  )
}
