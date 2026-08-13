'use client'

import { StatNumber } from '@/components/ui/StatNumber'
import { Save } from 'lucide-react'

type ContactSaveCtaProps = {
  count?: number
  loading?: boolean
  onOpen?: () => void
}

export function ContactSaveCta({ count, loading = false, onOpen }: ContactSaveCtaProps) {
  const countReady = typeof count === 'number' && Number.isFinite(count)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group mb-6 flex w-full flex-col justify-between gap-3 rounded-3xl border border-emerald-200/70 bg-linear-to-r from-emerald-50 to-white px-5 py-4 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md sm:flex-row sm:items-center dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-[#0b0f19] dark:hover:border-emerald-500/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Save className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white">
            <StatNumber
              value={count}
              loading={loading}
              className="font-black text-slate-900 dark:text-white"
              skeletonClassName="h-5 w-10 rounded-md"
            />
            <span>
              {countReady ? `visitor lead${count === 1 ? '' : 's'}` : 'visitor leads'} · contact saves & notes
            </span>
          </p>
          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            Open inbox — Contact Saves tab by default, Lead Notes when you need replies
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-xl bg-emerald-100/80 px-3 py-2 text-xs font-black tracking-wider text-emerald-700 uppercase transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:group-hover:bg-emerald-500/25">
        Open contact saves
      </span>
    </button>
  )
}
