'use client'

import { languageFlagImageUrl } from '@/lib/i18n/config'
import { useState } from 'react'

type LanguageFlagProps = {
  flagCode: string
  alt?: string
  className?: string
  width?: number
}

/** Country flag image for language pickers (falls back to letters if the CDN fails). */
export function LanguageFlag({ flagCode, alt, className, width = 40 }: LanguageFlagProps) {
  const [failed, setFailed] = useState(false)
  const code = flagCode.trim().toUpperCase() || 'US'

  if (failed) {
    return (
      <span
        className={
          className ||
          'inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-sm bg-black/10 text-[9px] font-black tracking-wider'
        }
        aria-hidden
      >
        {code}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote flag CDN; avoid next/image domain config
    <img
      src={languageFlagImageUrl(code, width)}
      alt={alt || `${code} flag`}
      width={Math.round(width * 0.7)}
      height={Math.round(width * 0.525)}
      loading="lazy"
      decoding="async"
      className={className || 'h-5 w-7 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10'}
      onError={() => setFailed(true)}
    />
  )
}
