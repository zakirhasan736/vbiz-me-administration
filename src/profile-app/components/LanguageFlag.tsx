'use client'

import { languageFlagCandidateUrls } from '@/lib/i18n/config'
import { Globe } from 'lucide-react'
import { useMemo, useState } from 'react'

type LanguageFlagProps = {
  flagCode: string
  alt?: string
  className?: string
  width?: number
  /** Kept for callers; images are preferred over emoji (Windows shows emoji as letter caps). */
  langCode?: string
}

/** Country flag image for language pickers — image CDNs only (never two-letter emoji caps). */
export function LanguageFlag({ flagCode, alt, className, width = 40 }: LanguageFlagProps) {
  const code = flagCode.trim().toUpperCase() || 'US'
  const candidates = useMemo(() => languageFlagCandidateUrls(code, width), [code, width])
  const [sourceIndex, setSourceIndex] = useState(0)
  // Reset CDN attempt when the selected language/country changes.
  const [activeCode, setActiveCode] = useState(code)
  if (activeCode !== code) {
    setActiveCode(code)
    setSourceIndex(0)
  }
  const src = candidates[Math.min(sourceIndex, candidates.length - 1)]
  const exhausted = sourceIndex >= candidates.length

  if (exhausted || !src) {
    return (
      <span
        className={
          className ||
          'inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-sm bg-zinc-200 text-zinc-700 ring-1 ring-black/10 dark:bg-zinc-700 dark:text-zinc-100'
        }
        aria-hidden={!alt}
        role={alt ? 'img' : undefined}
        aria-label={alt || `${code} flag`}
        title={alt || `${code} flag`}
      >
        <Globe size={Math.max(12, Math.round(width * 0.35))} strokeWidth={2.25} aria-hidden />
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote flag CDN; avoid next/image domain config
    <img
      key={src}
      src={src}
      alt={alt || `${code} flag`}
      width={Math.round(width * 0.7)}
      height={Math.round(width * 0.525)}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className || 'h-5 w-7 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10'}
      onError={() => setSourceIndex((prev) => prev + 1)}
    />
  )
}
