'use client'

import { V3SectionShell } from '@/profile-app/sections'
import { FileQuestion } from 'lucide-react'

type EmptyNavSectionProps = {
  title: string
}

/** Placeholder when a nav tab has no published content yet. */
export function EmptyNavSection({ title }: EmptyNavSectionProps) {
  return (
    <V3SectionShell>
      <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-4xl border border-dashed border-zinc-200 bg-white/40 px-6 py-16 text-center dark:border-zinc-800/80 dark:bg-[#031327]/40">
        <div className="vbiz-pill-icon mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border">
          <FileQuestion size={24} />
        </div>
        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed font-medium text-zinc-500 dark:text-zinc-400">
          Content for this section is not available yet. You can add it from the editor when ready.
        </p>
      </div>
    </V3SectionShell>
  )
}
