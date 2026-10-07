'use client'

type HideFromPublicCardButtonProps = {
  hidden: boolean
  onToggle: () => void
}

/** Stays on the editor row. Hides or shows that owner photo or video on this member's public card only. */
export function HideFromPublicCardButton({ hidden, onToggle }: HideFromPublicCardButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
    >
      {hidden ? 'Show on my public card' : 'Hide from my public card'}
    </button>
  )
}
