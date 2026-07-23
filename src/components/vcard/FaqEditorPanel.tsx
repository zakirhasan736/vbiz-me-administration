'use client'

import { createDefaultFaqEntry, normalizeFaqList } from '@/lib/vcardFaq'
import type { VCardFaqEntry } from '@/types/vcard'
import { FileBox, HelpCircle, Lightbulb, Plus, Trash2 } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm'
const textareaClasses =
  'w-full min-h-[120px] resize-y bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm'

type FaqEditorPanelProps = {
  faqs: VCardFaqEntry[] | null | undefined
  onFaqsChange: (next: VCardFaqEntry[]) => void
}

export function FaqEditorPanel({ faqs: rawFaqs, onFaqsChange }: FaqEditorPanelProps) {
  const faqs = normalizeFaqList(rawFaqs)

  const setFaqs = (next: VCardFaqEntry[]) => {
    onFaqsChange(next)
  }

  const addFaq = () => {
    setFaqs([createDefaultFaqEntry(), ...faqs])
  }

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id))
  }

  const updateFaq = (id: string, field: keyof VCardFaqEntry, value: VCardFaqEntry[keyof VCardFaqEntry]) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div
        className="mb-8 rounded-[24px] border border-amber-100 bg-amber-50/50 p-6 dark:border-amber-500/10 dark:bg-amber-500/2"
        data-tour-id="tour-editor-panel-faq"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400">FAQ</h3>
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="hidden items-center justify-center gap-2 rounded-[12px] bg-amber-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Questions and answers for the FAQ tab on your public profile (v1 and v2). Toggle visibility under Card
          Settings → Faq. Changes appear instantly in live preview.
        </p>
        <button
          type="button"
          onClick={addFaq}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-amber-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Question
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        {faqs.length === 0 ? (
          <div className="rounded-[32px] border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
              <FileBox className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No FAQ entries yet</h4>
            <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
              Click &quot;Add Question&quot; to publish your first FAQ on the profile FAQ section.
            </p>
            <button
              type="button"
              onClick={addFaq}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add Question
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <section
                key={faq.id}
                className="group/card overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
              >
                <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-100 bg-amber-50 font-black text-amber-600 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                      {faqs.length - index}
                    </div>
                    <h4 className="text-[16px] font-black text-slate-900 dark:text-white">
                      {faq.question || 'New Question'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFaq(faq.id)}
                    className="flex items-center gap-2 rounded-[12px] bg-red-50 px-4 py-2.5 font-bold text-red-500 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Remove FAQ"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>

                <div className="space-y-6 p-4 sm:p-8">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[12px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      <HelpCircle className="h-3.5 w-3.5" /> Question
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                      placeholder="e.g. What exactly is vBiz Me?"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      Answer
                    </label>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                      placeholder="Write a clear, helpful answer..."
                      className={textareaClasses}
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={faq.active}
                      onChange={(e) => updateFaq(faq.id, 'active', e.target.checked)}
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-slate-300 dark:border-white/20 dark:bg-[#0b0f19]"
                    />
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                      Show on public profile
                    </span>
                  </label>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
