'use client'

import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { cn } from '@/utils/cn'
import type { MyCardTeamNotice } from '@interfaces/api/myCard'
import { AlertTriangle, CheckCircle2, Info, Megaphone, X } from 'lucide-react'

function noticeTone(type: MyCardTeamNotice['type']) {
  if (type === 'warning' || type === 'system') {
    return {
      wrap: 'border-amber-200 bg-amber-50 text-amber-950',
      icon: 'text-amber-600',
      Icon: AlertTriangle,
      label: 'Notice',
    }
  }
  if (type === 'success') {
    return {
      wrap: 'border-emerald-200 bg-emerald-50 text-emerald-950',
      icon: 'text-emerald-600',
      Icon: CheckCircle2,
      label: 'Update',
    }
  }
  return {
    wrap: 'border-sky-200 bg-sky-50 text-sky-950',
    icon: 'text-sky-600',
    Icon: Info,
    label: 'Announcement',
  }
}

type Props = {
  open: boolean
  notice: MyCardTeamNotice | null
  ownerName?: string
  onClose: () => void
}

/** Public vCard notice shown after the intro video is skipped/finished. */
export function CardNoticeModal({ open, notice, ownerName, onClose }: Props) {
  if (!notice?.text?.trim()) return null

  const tone = noticeTone(notice.type)
  const Icon = tone.Icon

  return (
    <ProfileModalShell
      isOpen={open}
      onClose={onClose}
      backdropClassName="fixed inset-0 z-250 flex items-end justify-center bg-black/60 p-0 backdrop-blur-md sm:items-center sm:p-4"
      panelClassName="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-transparent bg-transparent shadow-none sm:rounded-2xl"
    >
      <div className={cn('overflow-hidden rounded-2xl border shadow-sm', tone.wrap)}>
        <div className="flex items-start gap-3 p-5">
          <div
            className={cn(
              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70',
              tone.icon
            )}
          >
            <Megaphone className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-wider uppercase opacity-70">
              {tone.label}
              {ownerName ? ` · ${ownerName}` : ''}
            </p>
            <p className="mt-1 text-sm leading-relaxed font-semibold whitespace-pre-wrap">{notice.text}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-black/5 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black tracking-wider text-white uppercase"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            Got it
          </button>
        </div>
      </div>
    </ProfileModalShell>
  )
}
