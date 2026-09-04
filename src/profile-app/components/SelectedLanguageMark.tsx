'use client'

import { languageDisplayName, languageFlagCodeForLang } from '@/lib/i18n/config'
import { useTranslation } from '@/lib/i18n/translationData'
import { LanguageFlag } from '@/profile-app/components/LanguageFlag'
import { cn } from '@/utils/cn'

type SelectedLanguageMarkProps = {
  className?: string
  flagClassName?: string
  nameClassName?: string
  showName?: boolean
  flagWidth?: number
}

/** Active public-card language: country flag + language name (never two-letter codes). */
export function SelectedLanguageMark({
  className,
  flagClassName,
  nameClassName,
  showName = true,
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
        alt=""
        width={flagWidth}
        className={flagClassName || 'h-4 w-6 rounded-[2px] object-cover shadow-sm ring-1 ring-black/15'}
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
