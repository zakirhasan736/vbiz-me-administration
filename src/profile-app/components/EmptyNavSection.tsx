'use client'

type EmptyNavSectionProps = {
  title: string
}

/** Placeholder when a nav tab has no published content yet. */
export function EmptyNavSection({ title }: EmptyNavSectionProps) {
  return (
    <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300/80 bg-zinc-50/50 px-6 py-16 text-center dark:border-zinc-700/60 dark:bg-zinc-900/30">
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
        Content for this section is not available yet. You can add it from the editor when ready.
      </p>
    </div>
  )
}
