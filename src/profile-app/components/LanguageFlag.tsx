'use client'

import { languageEmojiFlag, languageFlagImageUrl, languageFlagSvgUrl } from '@/lib/i18n/config'
import { useState } from 'react'

type LanguageFlagProps = {
  flagCode: string
  alt?: string
  className?: string
  width?: number
  /** Language code used only for the emoji fallback (e.g. en → 🇺🇸). */
  langCode?: string
}

/** Country flag image for language pickers (emoji fallback — never two-letter codes). */
export function LanguageFlag({ flagCode, alt, className, width = 40, langCode }: LanguageFlagProps) {
  const [failed, setFailed] = useState(false)
  const code = flagCode.trim().toUpperCase() || 'US'
  const emoji = languageEmojiFlag(langCode, code)

  if (failed) {
    return (
      <span
        className={
          className || 'inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-sm text-[14px] leading-none'
        }
        aria-hidden={!alt}
        role={alt ? 'img' : undefined}
        aria-label={alt}
      >
        {emoji}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote flag CDN; avoid next/image domain config
    <img
      src={languageFlagSvgUrl(code)}
      alt={alt || `${code} flag`}
      width={Math.round(width * 0.7)}
      height={Math.round(width * 0.525)}
      loading="lazy"
      decoding="async"
      className={className || 'h-5 w-7 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10'}
      onError={(event) => {
        const image = event.currentTarget
        if (image.dataset.pngFallback === '1') {
          setFailed(true)
          return
        }
        image.dataset.pngFallback = '1'
        image.src = languageFlagImageUrl(code, 40)
      }}
    />
  )
}
