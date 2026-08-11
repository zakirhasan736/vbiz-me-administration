'use client'

import { AiDropFillZone, type ParsedEntry } from '@/components/AiDropFillZone'
import { ReorderList } from '@/components/ReorderList'
import { SectionJumpPills } from '@/components/SectionJumpPills'
import { useVCard } from '@/lib/VCardContext'
import { createDefaultReviewEntry, normalizeReviewList } from '@/lib/vcardReviews'
import type { VCardReviewEntry } from '@/types/vcard'
import { MessageSquareQuote, Plus, Star, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

const inputClasses =
  'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0f19] px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500'
const textareaClasses =
  'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0f19] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500 resize-none'

export function TabReviews() {
  const { vCardData, updateData } = useVCard()
  const reviews = normalizeReviewList(vCardData.reviews)
  const reviewsRef = useRef(reviews)

  useEffect(() => {
    reviewsRef.current = reviews
  }, [reviews])

  const setReviews = (next: VCardReviewEntry[]) => updateData('reviews', next)

  const addReview = () => {
    setReviews([...reviewsRef.current, createDefaultReviewEntry()])
  }

  const removeReview = (id: string) => {
    setReviews(reviewsRef.current.filter((r) => r.id !== id))
  }

  const updateReview = (id: string, patch: Partial<VCardReviewEntry>) => {
    setReviews(reviewsRef.current.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const applyParsed = (entries: ParsedEntry[]) => {
    const mapped = entries.map((e, i) => ({
      ...createDefaultReviewEntry(),
      id: `rev_${Date.now()}_${i}`,
      author: e.title,
      text: e.description,
      rating: 5,
    }))
    setReviews([...mapped, ...reviewsRef.current.filter((r) => r.author || r.text)])
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-3xl flex-col space-y-6 pb-12 duration-500">
      <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6 dark:border-amber-500/10 dark:bg-amber-500/2">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
              <MessageSquareQuote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400">Reviews</h3>
          </div>
          <button
            type="button"
            onClick={addReview}
            className="hidden items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add review
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Showcase client testimonials on your public card.
        </p>
        <button
          type="button"
          onClick={addReview}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add review
        </button>
      </div>

      <AiDropFillZone
        section="reviews"
        currentDraft={{ reviews }}
        accent="amber"
        hint="Paste or upload reviews — AI maps author + quote (OCR for images)"
        onParsed={applyParsed}
      />

      <SectionJumpPills
        accent="amber"
        label="Jump to review"
        items={reviews.map((r) => ({
          id: r.id,
          title: r.author || 'Reviewer',
          detail: r.text?.slice(0, 40),
        }))}
      />

      {reviews.length === 0 ? (
        <div className="rounded-4xl border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
            <MessageSquareQuote className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No reviews yet</h4>
          <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            {`Click the "Add review" button to showcase client testimonials.`}
          </p>
        </div>
      ) : (
        <ReorderList
          items={reviews}
          getKey={(r) => r.id}
          onReorder={setReviews}
          renderItem={(item, idx, controls) => (
            <div
              id={`entry-${item.id}`}
              className="scroll-mt-24 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Review {idx + 1}</p>
                <div className="flex items-center gap-1">
                  {controls}
                  <button
                    type="button"
                    onClick={() => removeReview(item.id)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                value={item.author}
                onChange={(e) => updateReview(item.id, { author: e.target.value })}
                placeholder="Reviewer name"
                className={inputClasses}
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => updateReview(item.id, { rating: n })} className="p-1">
                    <Star
                      className={`h-5 w-5 ${n <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={item.text}
                onChange={(e) => updateReview(item.id, { text: e.target.value })}
                rows={3}
                placeholder="What they said…"
                className={textareaClasses}
              />
            </div>
          )}
        />
      )}

      {reviews.length > 0 ? (
        <button
          type="button"
          onClick={addReview}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-amber-300 px-4 py-2.5 text-sm font-bold text-amber-700 dark:border-amber-500/40 dark:text-amber-300"
        >
          <Plus className="h-4 w-4" /> Add review
        </button>
      ) : null}
    </div>
  )
}
