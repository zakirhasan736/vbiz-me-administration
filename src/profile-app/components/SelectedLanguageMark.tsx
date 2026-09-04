'use client'

import { languageDisplayName, languageFlagCodeForLang } from '@/lib/i18n/config'
import { useTranslation } from '@/lib/i18n/translationData'
import { LanguageFlag } from '@/profile-app/components/LanguageFlag'
import { cn } from '@/utils/cn'

type SelectedLanguageMarkProps = {
  className?: string
  flagClassName?: string
  nameClassName?: string
  /** Home language button uses flag only (same image as Select Language popup). */
  showName?: boolean
  flagWidth?: number
}

/**
 * Selected language mark for the home language button.
 * Uses the same country flag image as each row in the Select Language popup.
 */
export function SelectedLanguageMark({
  className,
  flagClassName,
  nameClassName,
  showName = false,
  flagWidth = 40,
}: SelectedLanguageMarkProps) {
  const { lang } = useTranslation()
  const name = languageDisplayName(lang)
  const flagCode = languageFlagCodeForLang(lang)

  return (
    <span
      title={name}
      aria-label={name}
      className={cn('notranslate inline-flex flex-col items-center justify-center leading-none', className)}
    >
      <LanguageFlag
        flagCode={flagCode}
        langCode={lang}
        alt={name}
        width={flagWidth}
        className={flagClassName || 'h-5 w-7 shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/15'}
      />
      {showName ? (
        <span
          className={cn('mt-0.5 max-w-16 text-center text-[7px] leading-tight font-bold tracking-tight', nameClassName)}
        >
          {name}
        </span>
      ) : null}
    </span>
  )
}
