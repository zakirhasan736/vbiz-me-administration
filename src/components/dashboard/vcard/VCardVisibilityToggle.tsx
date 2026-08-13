'use client'

type VCardVisibilityToggleProps = {
  id: string
  checked: boolean
  disabled?: boolean
  title?: string
  onChange: (next: boolean) => void
  compact?: boolean
}

export function VCardVisibilityToggle({ id, checked, disabled, title, onChange, compact }: VCardVisibilityToggleProps) {
  return (
    <div
      className={
        compact
          ? 'flex shrink-0 flex-col items-end gap-1'
          : 'flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 whitespace-nowrap shadow-sm dark:border-white/5 dark:bg-white/5'
      }
      onClick={(e) => e.stopPropagation()}
      title={title}
    >
      <span
        className={
          compact
            ? 'text-[8px] font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400'
            : 'pointer-events-none text-[10px] font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400'
        }
      >
        Visibility
      </span>
      <label htmlFor={id} className="group flex cursor-pointer items-center justify-center">
        <div className="relative flex items-center justify-center">
          <input
            id={id}
            type="checkbox"
            role="switch"
            aria-checked={checked}
            aria-label="Card visibility"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 shadow-sm peer-checked:bg-emerald-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500 peer-disabled:opacity-50 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-4 peer-checked:after:border-white dark:bg-slate-700" />
        </div>
      </label>
    </div>
  )
}
