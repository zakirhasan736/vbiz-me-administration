'use client'

import { displayIconChromeStyle } from '@/lib/vcardDisplaySettings'
import { SelectedLanguageMark } from '@/profile-app/components/SelectedLanguageMark'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useOptionalTranslationUi } from '@/profile-app/providers/TranslationProvider'

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
      className={`vbiz-icon-btn inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 ${className}`}
      style={displayIconChromeStyle(field('Language'))}
    >
      <SelectedLanguageMark
        showName={false}
        flagWidth={48}
        flagClassName="h-5 w-7 rounded-[3px] object-cover shadow-sm ring-1 ring-black/10"
      />
    </button>
  )
}
