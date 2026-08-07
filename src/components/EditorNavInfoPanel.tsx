'use client'

type EditorNavInfoPanelProps = {
  infoKey: 'public-cards'
  tourTargetId?: string
}

export function EditorNavInfoPanel({ infoKey, tourTargetId }: EditorNavInfoPanelProps) {
  if (infoKey !== 'public-cards') return null

  return (
    <div
      data-tour-id={tourTargetId}
      className="flex min-h-70 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center dark:border-white/10 dark:bg-white/2"
    >
      <p className="text-base font-bold text-slate-900 dark:text-white">Public Cards</p>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        This section shows the public directory of cards and is not edited here. Enable or disable it from Card Settings
        → Nav Bar.
      </p>
    </div>
  )
}
