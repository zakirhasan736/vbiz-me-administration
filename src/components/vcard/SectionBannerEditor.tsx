'use client'

import { Modal } from '@/components/ui'
import { useVCard } from '@/lib/VCardContext'
import { defaultBannerDescription, getTabSectionMetaEntry, upsertTabSectionMetaEntry } from '@/lib/vcardTabSectionMeta'
import { Highlighter, StickyNote, Type, X } from 'lucide-react'
import { useState } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm'
const textareaClasses = `${inputClasses} min-h-0 resize-y`

type SectionBannerEditorProps = {
  tabId: string
  tabName: string
}

export function SectionBannerEditor({ tabId, tabName }: SectionBannerEditorProps) {
  const { vCardData, updateData } = useVCard()
  const meta = getTabSectionMetaEntry(vCardData.tabSectionMeta, tabId)
  const defaultDescription = defaultBannerDescription(tabId)
  const titleValue = meta.bannerTitle ?? tabName
  const descriptionValue = meta.bannerDescription === undefined ? defaultDescription : meta.bannerDescription
  const notesValue = meta.notes ?? ''
  const hasNotes = Boolean(notesValue.trim())
  const [notesOpen, setNotesOpen] = useState(false)

  if (!tabId.trim()) return null

  const patch = (next: { bannerTitle?: string; bannerDescription?: string; notes?: string }) => {
    updateData('tabSectionMeta', upsertTabSectionMetaEntry(vCardData.tabSectionMeta, tabId, next))
  }

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/40 shadow-sm dark:border-amber-500/10 dark:bg-amber-500/5">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
          <Type className="h-4 w-4 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">Tab banner</h4>
          <p className="hidden text-[11px] font-medium text-slate-500 sm:block dark:text-slate-400">
            Defaults to this tab name and description. Empty notes stay hidden on the public card.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-2 text-[12px] font-bold text-amber-800 shadow-sm transition hover:bg-amber-50 dark:border-amber-500/20 dark:bg-[#0b0f19] dark:text-amber-200 dark:hover:bg-amber-500/10"
        >
          <StickyNote className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{hasNotes ? 'Edit notes' : 'Add notes'}</span>
          <span className="sm:hidden">{hasNotes ? 'Notes' : 'Note'}</span>
          {hasNotes ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> : null}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-amber-100/80 px-4 py-3 sm:grid-cols-2 sm:px-5 dark:border-amber-500/10">
        <div>
          <label className="mb-1 block pl-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Banner title
          </label>
          <input
            type="text"
            value={titleValue}
            onChange={(event) => patch({ bannerTitle: event.target.value })}
            placeholder={tabName || 'Tab name'}
            className={inputClasses}
          />
        </div>
        <div>
          <label className="mb-1 block pl-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Banner description
          </label>
          <textarea
            value={descriptionValue}
            onChange={(event) => patch({ bannerDescription: event.target.value })}
            placeholder={defaultDescription}
            rows={2}
            className={textareaClasses}
          />
        </div>
      </div>

      <Modal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#0b0f19]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h5 className="flex items-center gap-2 text-[15px] font-black text-slate-900 dark:text-white">
              <Highlighter className="h-4 w-4 text-amber-600" />
              Notes / highlight
            </h5>
            <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Optional. Leave empty to hide notes on the public card.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotesOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close notes"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={notesValue}
          onChange={(event) => patch({ notes: event.target.value })}
          placeholder="Add an instruction, highlight, or short note for visitors."
          rows={5}
          className={`${textareaClasses} min-h-28`}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {hasNotes ? (
            <button
              type="button"
              onClick={() => {
                patch({ notes: '' })
                setNotesOpen(false)
              }}
              className="text-[12px] font-bold text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
            >
              Remove notes
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setNotesOpen(false)}
            className="rounded-xl bg-amber-600 px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-amber-700"
          >
            Done
          </button>
        </div>
      </Modal>
    </section>
  )
}
