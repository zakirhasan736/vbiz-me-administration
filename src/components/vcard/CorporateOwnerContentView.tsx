'use client'

import type { ReactNode } from 'react'

/** Read-only summary of content the corporate owner added. Shown on a corporate member card. */
export function CorporateOwnerContentView({
  lines,
  imageUrl,
  extra,
}: {
  lines: Array<string | null | undefined>
  imageUrl?: string | null
  extra?: ReactNode
}) {
  const text = lines.map((line) => (line || '').trim()).filter(Boolean)
  return (
    <div className="space-y-3">
      <p className="text-[12px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        Added by the corporate owner · view only on this member card
      </p>
      {text.map((line, index) => (
        <p
          key={`${index}-${line.slice(0, 24)}`}
          className={
            index === 0
              ? 'text-[15px] font-bold text-slate-900 dark:text-white'
              : 'text-[13px] leading-relaxed text-slate-600 dark:text-slate-300'
          }
        >
          {line}
        </p>
      ))}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="max-h-48 w-full rounded-xl object-cover" />
      ) : null}
      {extra}
    </div>
  )
}
