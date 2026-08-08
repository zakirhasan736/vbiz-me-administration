'use client'

import { Save } from 'lucide-react'

type ContactsSavedCardProps = {
  count?: number
  profileName?: string
  uniqueViews?: number
  shares?: number
  onOpen?: () => void
}

export function ContactsSavedCard({
  count = 0,
  profileName = 'Your card',
  uniqueViews = 0,
  shares = 0,
  onOpen,
}: ContactsSavedCardProps) {
  const className =
    'group flex h-full flex-col justify-between rounded-4xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition-all sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]' +
    (onOpen
      ? ' hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-lg dark:hover:border-emerald-500/30'
      : '')

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm transition-transform group-hover:scale-105 dark:border-emerald-500/10 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Save className="h-6 w-6" />
          </span>
          <div>
            <h4 className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Contacts Saved</h4>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">Click to browse every saved person</p>
          </div>
        </div>
        {onOpen && (
          <span className="shrink-0 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-600 uppercase dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            Open list
          </span>
        )}
      </div>

      <div className="my-6 flex items-baseline gap-3">
        <span className="text-6xl font-black tracking-tighter text-slate-900 tabular-nums dark:text-white">
          {Number(count).toLocaleString()}
        </span>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">guests saved a contact</span>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Profile</span>
          <span className="mt-1 block truncate text-sm font-extrabold text-slate-800 dark:text-white">
            {profileName}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Unique</span>
          <span className="mt-1 block text-xl font-extrabold text-indigo-500 tabular-nums">
            {Number(uniqueViews).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Shares</span>
          <span className="mt-1 block text-xl font-extrabold text-violet-500 tabular-nums">
            {Number(shares).toLocaleString()}
          </span>
        </div>
      </div>
    </>
  )

  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={className}>
        {body}
      </button>
    )
  }

  return <div className={className}>{body}</div>
}
