'use client'

type HideOwnerMediaToggleProps = {
  checked: boolean
  label: string
  detail: string
  onChange: (next: boolean) => void
}

export function HideOwnerMediaToggle({ checked, label, detail, onChange }: HideOwnerMediaToggleProps) {
  return (
    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0b0f19]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-teal-600"
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          {detail}
        </span>
      </span>
    </label>
  )
}
