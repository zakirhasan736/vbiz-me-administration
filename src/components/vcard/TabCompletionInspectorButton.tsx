'use client'

import { Modal } from '@/components/ui/Modal'
import { CompletionQuickFillEditor } from '@/components/vcard/CompletionQuickFillEditor'
import { subscribeAboutMeDraft } from '@/lib/aboutMeDraft'
import {
  getCompletionFieldPreview,
  getEditorPanelCompletionStats,
  type PersonalCompletionMeta,
  type VCardCompletionField,
} from '@/lib/vcardCompletion'
import { useVCard } from '@/lib/VCardContext'
import type { EditorNavPanel } from '@/lib/vcardNavbar'
import type { VCardData } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Check, ListChecks, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type TabCompletionInspectorButtonProps = {
  label: string
  panel: EditorNavPanel
  vCardData?: VCardData
  completionMeta?: PersonalCompletionMeta
  className?: string
  compact?: boolean
}

function groupFields(fields: VCardCompletionField[]) {
  const groups: Array<{ name: string; fields: VCardCompletionField[] }> = []
  const index = new Map<string, number>()
  for (const field of fields) {
    const name = field.group || 'Details'
    const existing = index.get(name)
    if (existing == null) {
      index.set(name, groups.length)
      groups.push({ name, fields: [field] })
    } else {
      groups[existing].fields.push(field)
    }
  }
  return groups
}

function FieldReviewRow({
  field,
  preview,
  expanded,
  onToggle,
}: {
  field: VCardCompletionField
  preview: string
  expanded: boolean
  onToggle: () => void
}) {
  const editable = Boolean(field.edit)

  return (
    <li
      className={cn(
        'border-b border-slate-100 last:border-b-0 dark:border-white/5',
        expanded && 'bg-sky-50/80 dark:bg-sky-500/10'
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{field.label}</p>
          {field.hint && !expanded ? (
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">{field.hint}</p>
          ) : null}
        </div>
        <div className="flex max-w-[58%] shrink-0 items-center justify-end gap-2">
          {field.filled && !expanded ? (
            <>
              <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{preview || 'Added'}</span>
              {editable ? (
                <button
                  type="button"
                  onClick={onToggle}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-500/15"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </>
          ) : null}
          {!field.filled && !expanded ? (
            editable ? (
              <button
                type="button"
                onClick={onToggle}
                className="inline-flex items-center gap-1 text-sm font-black text-sky-600 hover:underline dark:text-sky-300"
              >
                Add
              </button>
            ) : (
              <span className="text-sm font-semibold text-slate-400">—</span>
            )
          ) : null}
          {expanded ? (
            <button
              type="button"
              onClick={onToggle}
              className="text-[11px] font-black tracking-wide text-slate-400 uppercase hover:text-slate-600"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
      {expanded && editable ? (
        <div className="border-t border-sky-100 px-4 pt-3 pb-4 dark:border-sky-500/20">
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
  const vCardData = vCardDataProp ?? liveData
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aboutMeDraftVersion, setAboutMeDraftVersion] = useState(0)

  useEffect(() => {
    if (panel.kind !== 'about-me') return
    return subscribeAboutMeDraft(() => setAboutMeDraftVersion((n) => n + 1))
  }, [panel.kind])

  const stats = useMemo(() => {
    void aboutMeDraftVersion
    return getEditorPanelCompletionStats(panel, vCardData, completionMeta)
  }, [panel, vCardData, completionMeta, aboutMeDraftVersion])
  const { fields, filled, empty, total, percent } = stats
  const groups = useMemo(() => groupFields(fields), [fields])

  const closeModal = () => {
    setOpen(false)
    setExpandedId(null)
  }

  if (!total) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const firstEmpty = fields.find((field) => !field.filled && field.edit)
          setExpandedId(firstEmpty?.id || null)
          setOpen(true)
        }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border text-xs font-black whitespace-nowrap transition',
          empty
            ? 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
          compact ? 'px-3 py-2' : 'px-4 py-2.5',
          className
        )}
      >
        <ListChecks className="h-4 w-4" />
        {empty ? `Fill empty fields ${filled}/${total}` : `${filled}/${total} complete`}
      </button>

      <Modal
        open={open}
        onClose={closeModal}
        overlayClassName="bg-slate-950/55"
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">{label}</h3>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-black',
                    empty
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                      : 'bg-emerald-500 text-white'
                  )}
                >
                  {empty ? `${empty} empty` : 'Complete'}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {filled} of {total} fields filled
                {empty ? ' — tap Add on an empty row, or Edit to change a value.' : '.'}
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
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <span className="block h-full rounded-full bg-sky-600 transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto">
          {groups.map((group) => (
            <section key={group.name} className="border-b border-slate-100 last:border-b-0 dark:border-white/10">
              {groups.length > 1 ? (
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2 dark:bg-white/4">
                  <p className="text-[11px] font-black tracking-wide text-slate-500 uppercase">{group.name}</p>
                  <span className="text-[11px] font-bold text-slate-400">
                    {group.fields.filter((field) => field.filled).length}/{group.fields.length}
                  </span>
                </div>
              ) : null}
              <ul>
                {group.fields.map((field) => (
                  <FieldReviewRow
                    key={field.id}
                    field={field}
                    preview={getCompletionFieldPreview(field, vCardData, completionMeta)}
                    expanded={expandedId === field.id}
                    onToggle={() => setExpandedId((prev) => (prev === field.id ? null : field.id))}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/4">
          {empty ? (
            <p className="mr-auto hidden text-[11px] font-semibold text-slate-500 sm:block">
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Add fills a blank. Edit changes a saved value.
            </p>
          ) : null}
          <button
            type="button"
            onClick={closeModal}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-black text-white hover:bg-sky-700"
          >
            {empty ? 'Done for now' : 'Accept'}
          </button>
        </div>
      </Modal>
    </>
  )
}
