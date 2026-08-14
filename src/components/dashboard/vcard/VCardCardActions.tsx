'use client'

import { cn } from '@/utils/cn'
import { Calendar, Copy, Edit2, ExternalLink, Loader2, Mail, PanelRight, Phone, QrCode } from 'lucide-react'
import type { MouseEvent } from 'react'

type Props = {
  /** Admin-only contact actions — omit for owner/corporate surfaces. */
  onEmail?: () => void
  onCall?: () => void
  onSchedule?: () => void
  onEdit: () => void
  onView: () => void
  onPanel: () => void
  onQr: () => void
  onDuplicate: () => void
  duplicateDisabled?: boolean
  duplicateTitle?: string
  /** Shows spinner and disables the Duplicate button while a copy is being created. */
  isDuplicating?: boolean
  editDisabled?: boolean
  editTitle?: string
  className?: string
}

/**
 * Card bottom actions — fixed order matching backoffice:
 * 1) Email · Call · Schedule (admin only)
 * 2) Edit · View · Panel
 * 3) QR Code · Duplicate
 */
export function VCardCardActions({
  onEmail,
  onCall,
  onSchedule,
  onEdit,
  onView,
  onPanel,
  onQr,
  onDuplicate,
  duplicateDisabled,
  duplicateTitle = 'Duplicate',
  isDuplicating = false,
  editDisabled,
  editTitle = 'Edit card',
  className,
}: Props) {
  const duplicateBusy = Boolean(duplicateDisabled || isDuplicating)
  const stop = (e: MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  const showContactActions = Boolean(onEmail || onCall || onSchedule)

  return (
    <div className={cn('mt-auto shrink-0 space-y-1.5 border-t border-slate-100 pt-2 dark:border-white/5', className)}>
      {showContactActions ? (
        <div className="grid grid-cols-3 gap-1.5">
          {onEmail ? (
            <button
              type="button"
              onClick={(e) => stop(e, onEmail)}
              className="inline-flex items-center justify-center gap-0.5 rounded-lg bg-indigo-50 py-1.5 text-[9px] font-black tracking-wider text-indigo-700 uppercase hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
              title="Email"
            >
              <Mail className="h-3 w-3" /> Email
            </button>
          ) : (
            <span />
          )}
          {onCall ? (
            <button
              type="button"
              onClick={(e) => stop(e, onCall)}
              className="inline-flex items-center justify-center gap-0.5 rounded-lg bg-emerald-50 py-1.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
              title="Call"
            >
              <Phone className="h-3 w-3" /> Call
            </button>
          ) : (
            <span />
          )}
          {onSchedule ? (
            <button
              type="button"
              onClick={(e) => stop(e, onSchedule)}
              className="inline-flex items-center justify-center gap-0.5 rounded-lg bg-violet-50 py-1.5 text-[9px] font-black tracking-wider text-violet-700 uppercase hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25"
              title="Schedule"
            >
              <Calendar className="h-3 w-3" /> Schedule
            </button>
          ) : (
            <span />
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            if (editDisabled) {
              e.stopPropagation()
              return
            }
            stop(e, onEdit)
          }}
          disabled={editDisabled}
          title={editTitle}
          className={cn(
            'inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-black tracking-wider text-white uppercase',
            editDisabled ? 'cursor-not-allowed bg-indigo-400 opacity-60' : 'bg-indigo-600 hover:bg-indigo-700'
          )}
        >
          <Edit2 className="h-3 w-3" /> Edit
        </button>
        <button
          type="button"
          onClick={(e) => stop(e, onView)}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 py-1.5 text-[10px] font-black tracking-wider text-slate-700 uppercase hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="View live card"
        >
          <ExternalLink className="h-3 w-3" /> View
        </button>
        <button
          type="button"
          onClick={(e) => stop(e, onPanel)}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-violet-50 py-1.5 text-[10px] font-black tracking-wider text-violet-700 uppercase hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25"
          title="Open editor panel"
        >
          <PanelRight className="h-3 w-3" /> Panel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={(e) => stop(e, onQr)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-[10px] font-black tracking-wider text-slate-700 uppercase hover:border-indigo-400/50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
          title="QR Code"
        >
          <QrCode className="h-3.5 w-3.5" /> QR Code
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (!duplicateBusy) onDuplicate()
          }}
          disabled={duplicateBusy}
          title={isDuplicating ? 'Duplicating…' : duplicateTitle}
          aria-busy={isDuplicating}
          className={cn(
            'inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black tracking-wider uppercase',
            duplicateBusy
              ? 'cursor-not-allowed bg-slate-50 text-slate-400 opacity-60'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200'
          )}
        >
          {isDuplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          {isDuplicating ? 'Duplicating…' : 'Duplicate'}
        </button>
      </div>
    </div>
  )
}
