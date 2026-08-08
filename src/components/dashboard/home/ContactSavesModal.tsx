'use client'

import { cn } from '@/utils/cn'
import { MessageCircle, Save, X } from 'lucide-react'
import { ContactSavesPanel, type DashboardContact } from './ContactSavesPanel'
import { LeadNotesPanel } from './LeadNotesPanel'

export type ContactSavesModalTab = 'saves' | 'notes'

type ContactSavesModalProps = {
  count: number
  contacts: DashboardContact[]
  notesCount?: number
  tab: ContactSavesModalTab
  onTabChange: (tab: ContactSavesModalTab) => void
  onClose: () => void
}

export function ContactSavesModal({
  count,
  contacts,
  notesCount = 0,
  tab,
  onTabChange,
  onClose,
}: ContactSavesModalProps) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center overflow-x-hidden bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-full min-w-0 flex-col overflow-hidden overflow-x-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:max-w-4xl sm:rounded-4xl dark:border-white/10 dark:bg-[#0b0f19]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-white/10">
          <div className="min-w-0">
            <p className="text-base font-black text-slate-900 dark:text-white">Contact Saves</p>
            <p className="text-[11px] font-semibold wrap-break-word text-slate-400">
              {count} guest{count === 1 ? '' : 's'} — Saves & Notes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-3 pt-3 sm:px-4 dark:border-white/5">
          <div className="flex w-full gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => onTabChange('saves')}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-black tracking-wider uppercase transition-all sm:px-4 sm:text-[11px]',
                tab === 'saves'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-[#151a27] dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              <Save className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Contact Saves</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('notes')}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-black tracking-wider uppercase transition-all sm:px-4 sm:text-[11px]',
                tab === 'notes'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-[#151a27] dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Lead Notes</span>
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-3">
          {tab === 'saves' ? (
            <ContactSavesPanel contacts={contacts} />
          ) : (
            <LeadNotesPanel contacts={contacts} notesCount={notesCount} />
          )}
        </div>
      </div>
    </div>
  )
}
