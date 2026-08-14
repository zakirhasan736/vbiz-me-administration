'use client'

import { Modal } from '@/components/ui/Modal'
import {
  getEditorPanelCompletionFields,
  type PersonalCompletionMeta,
  type VCardCompletionField,
} from '@/lib/vcardCompletion'
import type { EditorNavPanel } from '@/lib/vcardNavbar'
import type { VCardData } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Check, FileUp, ListChecks, Wand2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

type TabCompletionInspectorButtonProps = {
  label: string
  panel: EditorNavPanel
  vCardData: VCardData
  completionMeta?: PersonalCompletionMeta
  onFillWithAi?: () => void
  className?: string
  compact?: boolean
}

function fieldPercent(fields: VCardCompletionField[]) {
  if (!fields.length) return 0
  return Math.round((fields.filter((field) => field.filled).length / fields.length) * 100)
}

function FieldRow({ field }: { field: VCardCompletionField }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          field.filled
            ? 'bg-emerald-500 text-white'
            : field.upload
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
        )}
      >
        {field.filled ? <Check className="h-3.5 w-3.5" /> : field.upload ? <FileUp className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-sm font-black',
            field.filled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'
          )}
        >
          {field.label}
        </span>
        {field.group ? <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{field.group}</span> : null}
        {field.hint ? (
          <span className="mt-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-300">{field.hint}</span>
        ) : null}
      </span>
    </li>
  )
}

export function TabCompletionInspectorButton({
  label,
  panel,
  vCardData,
  completionMeta,
  onFillWithAi,
  className,
  compact,
}: TabCompletionInspectorButtonProps) {
  const [open, setOpen] = useState(false)
  const fields = useMemo(
    () => getEditorPanelCompletionFields(panel, vCardData, completionMeta),
    [panel, vCardData, completionMeta]
  )
  const missingFields = fields.filter((field) => !field.filled)
  const completedFields = fields.filter((field) => field.filled)
  const textMissingFields = missingFields.filter((field) => !field.upload)
  const percent = fieldPercent(fields)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-black whitespace-nowrap text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20',
          compact ? 'px-3 py-2' : 'px-4 py-2.5',
          className
        )}
      >
        <ListChecks className="h-4 w-4" />
        {missingFields.length ? `Fill empty fields (${missingFields.length})` : `Complete fields (${percent}%)`}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        overlayClassName="bg-slate-950/55"
        className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-0 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-slate-950/50">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-widest text-indigo-600 uppercase dark:text-indigo-300">
              Tab completion
            </p>
            <h3 className="mt-1 truncate text-lg font-black text-slate-950 dark:text-white">{label}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {percent}% complete - {missingFields.length} empty field{missingFields.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[62vh] space-y-5 overflow-y-auto p-5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <span className="block h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
          </div>

          {missingFields.length ? (
            <section className="space-y-2">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Empty fields</p>
              <ul className="space-y-2">
                {missingFields.map((field) => (
                  <FieldRow key={`missing-${field.group || ''}-${field.label}`} field={field} />
                ))}
              </ul>
            </section>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              This tab has no empty checklist fields. Upload areas can still be polished with Gallery or Canva assets.
            </div>
          )}

          {completedFields.length ? (
            <section className="space-y-2">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Completed fields</p>
              <ul className="space-y-2">
                {completedFields.map((field) => (
                  <FieldRow key={`done-${field.group || ''}-${field.label}`} field={field} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-slate-950/50">
          <p className="text-[11px] font-semibold text-slate-500">
            Upload rows support manual upload, Gallery, or Canva wherever the field offers media actions.
          </p>
          <div className="flex items-center gap-3">
            {textMissingFields.length && onFillWithAi ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onFillWithAi()
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700"
              >
                <Wand2 className="h-4 w-4" /> Fill text with AI
              </button>
            ) : null}
            {textMissingFields.length ? (
              <div className="text-sm font-semibold text-slate-500">
                Please complete these text fields manually. Upload areas support manual upload, Gallery, or Canva
                (connect Canva in Settings to enable Canva integration).
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  )
}
