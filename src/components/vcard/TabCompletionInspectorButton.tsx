'use client'

import { Modal } from '@/components/ui/Modal'
import { CompletionQuickFillEditor } from '@/components/vcard/CompletionQuickFillEditor'
import {
  getEditorPanelCompletionFields,
  type PersonalCompletionMeta,
  type VCardCompletionField,
} from '@/lib/vcardCompletion'
import { useVCard } from '@/lib/VCardContext'
import type { EditorNavPanel } from '@/lib/vcardNavbar'
import type { VCardData } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Check, ChevronDown, ChevronRight, FileUp, ListChecks, X } from 'lucide-react'
import { useMemo, useState } from 'react'

type TabCompletionInspectorButtonProps = {
  label: string
  panel: EditorNavPanel
  /** Prefer this when provided; falls back to live context. */
  vCardData?: VCardData
  completionMeta?: PersonalCompletionMeta
  className?: string
  compact?: boolean
}

function fieldPercent(fields: VCardCompletionField[]) {
  if (!fields.length) return 0
  return Math.round((fields.filter((field) => field.filled).length / fields.length) * 100)
}

function CompletedFieldRow({ field }: { field: VCardCompletionField }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-500 line-through">{field.label}</span>
        {field.group ? <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{field.group}</span> : null}
      </span>
    </li>
  )
}

function MissingFieldAccordion({
  field,
  expanded,
  onToggle,
}: {
  field: VCardCompletionField
  expanded: boolean
  onToggle: () => void
}) {
  const editable = Boolean(field.edit)

  return (
    <li
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/40',
        expanded && 'border-indigo-200 dark:border-indigo-500/30'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!editable}
        className={cn(
          'flex w-full items-start gap-3 p-3 text-left transition',
          editable ? 'hover:bg-slate-50 dark:hover:bg-white/5' : 'cursor-default opacity-80'
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            field.upload
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
          )}
        >
          {field.upload ? <FileUp className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-900 dark:text-white">{field.label}</span>
          {field.group ? (
            <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{field.group}</span>
          ) : null}
          {field.hint ? (
            <span className="mt-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-300">
              {field.hint}
            </span>
          ) : null}
          {editable ? (
            <span className="mt-1.5 block text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-300">
              {expanded ? 'Quick fill open' : 'Tap to fill, then Apply'}
            </span>
          ) : null}
        </span>
        {editable ? (
          <span className="mt-0.5 text-slate-400">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        ) : null}
      </button>

      {expanded && editable ? (
        <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-4 dark:border-white/5 dark:bg-slate-950/60">
          <CompletionQuickFillEditor key={field.id} field={field} />
        </div>
      ) : null}
    </li>
  )
}

export function TabCompletionInspectorButton({
  label,
  panel,
  vCardData: vCardDataProp,
  completionMeta,
  className,
  compact,
}: TabCompletionInspectorButtonProps) {
  const { vCardData: liveData } = useVCard()
  // Parent prop + context — prefer the freshest snapshot so Empty/Completed update without refresh.
  const vCardData = vCardDataProp ?? liveData
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fields = useMemo(
    () => getEditorPanelCompletionFields(panel, vCardData, completionMeta),
    [panel, vCardData, completionMeta]
  )
  const missingFields = useMemo(() => fields.filter((field) => !field.filled), [fields])
  const completedFields = useMemo(() => fields.filter((field) => field.filled), [fields])
  const percent = fieldPercent(fields)

  // Collapse automatically once Apply/upload moves the open row to Completed (no setState).
  const activeExpandedId = expandedId && missingFields.some((field) => field.id === expandedId) ? expandedId : null

  const closeModal = () => {
    setOpen(false)
    setExpandedId(null)
  }

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
        onClose={closeModal}
        overlayClassName="bg-slate-950/55"
        className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-0 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
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
            onClick={closeModal}
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
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Tap an incomplete item to expand, fill it, then hit Apply. Media uploads save immediately.
              </p>
              <ul className="space-y-2">
                {missingFields.map((field) => (
                  <MissingFieldAccordion
                    key={field.id}
                    field={field}
                    expanded={activeExpandedId === field.id}
                    onToggle={() => setExpandedId((prev) => (prev === field.id ? null : field.id))}
                  />
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
                  <CompletedFieldRow key={field.id} field={field} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </Modal>
    </>
  )
}
