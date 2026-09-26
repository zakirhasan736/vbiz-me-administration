'use client'

import { useVCard } from '@/lib/VCardContext'
import { defaultBannerDescription, getTabSectionMetaEntry, upsertTabSectionMetaEntry } from '@/lib/vcardTabSectionMeta'
import { Highlighter, StickyNote, Type } from 'lucide-react'
import { useState } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm'
const textareaClasses = `${inputClasses} min-h-24 resize-y`

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
  const [notesOpen, setNotesOpen] = useState(Boolean(notesValue.trim()))

  if (!tabId.trim()) return null

  const patch = (next: { bannerTitle?: string; bannerDescription?: string; notes?: string }) => {
    updateData('tabSectionMeta', upsertTabSectionMetaEntry(vCardData.tabSectionMeta, tabId, next))
  }

  return (
    <section className="mb-8 overflow-hidden rounded-4xl border border-amber-100 bg-amber-50/40 shadow-sm dark:border-amber-500/10 dark:bg-amber-500/5">
      <div className="flex items-center gap-4 border-b border-amber-100/80 px-4 py-5 sm:px-8 dark:border-amber-500/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
          <Type className="h-5 w-5 text-amber-700 dark:text-amber-300" />
        </div>
        <div>
          <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Tab banner</h4>
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Title defaults to this tab name. Empty description or notes stay hidden on the public card.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-8">
        <div>
          <label className="mb-1.5 block pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
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
          <label className="mb-1.5 block pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Banner description
          </label>
          <textarea
            value={descriptionValue}
            onChange={(event) => patch({ bannerDescription: event.target.value })}
            placeholder={defaultDescription}
            className={textareaClasses}
          />
        </div>

        {notesOpen || notesValue.trim() ? (
          <div>
            <label className="mb-1.5 block pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Notes / highlight
            </label>
            <textarea
              value={notesValue}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Add an instruction, highlight, or short note for visitors."
              className={textareaClasses}
            />
            <button
              type="button"
              onClick={() => {
                patch({ notes: '' })
                setNotesOpen(false)
              }}
              className="mt-2 text-[12px] font-bold text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
            >
              Remove notes
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-[13px] font-bold text-amber-800 shadow-sm transition hover:bg-amber-50 dark:border-amber-500/20 dark:bg-[#0b0f19] dark:text-amber-200 dark:hover:bg-amber-500/10"
          >
            <StickyNote className="h-4 w-4" />
            Add notes
            <Highlighter className="h-4 w-4 opacity-70" />
          </button>
        )}
      </div>
    </section>
  )
}
