'use client'

type EditorNavEmptyPanelProps = {
  title: string
  tourTargetId?: string
}

export function EditorNavEmptyPanel({ title, tourTargetId }: EditorNavEmptyPanelProps) {
  return (
    <div
      data-tour-id={tourTargetId}
      className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center dark:border-white/10 dark:bg-white/2"
    >
      <p className="text-base font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        This section does not have an editor yet. You can still show it on your vCard from Nav Bar settings.
      </p>
    </div>
  )
}
