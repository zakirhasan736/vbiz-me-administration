'use client'

import type { ReviewListItem } from '@/interfaces/api/reviews.interface'
import { ReviewAvatar } from '@/profile-app/components/ReviewAvatar'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { ArrowLeft, ExternalLink, Quote, Star } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

function ReviewStars({
  rating,
  className = 'h-4 w-4',
  filledClassName = 'fill-yellow-primary text-yellow-primary',
  emptyClassName = 'text-zinc-300 dark:text-zinc-600',
}: {
  rating: number
  className?: string
  filledClassName?: string
  emptyClassName?: string
}) {
  const value = Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 5
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= value ? filledClassName : emptyClassName}`} />
      ))}
    </>
  )
}

type AllReviewsViewProps = {
  sectionTitle: string
  slides: ReviewListItem[]
  onBack: () => void
}

/** `compact` = editor phone preview: drop the `md:`/`sm:` size bumps that the desktop viewport would pick. */
function ReviewCardContent({ item, compact }: { item: ReviewListItem; compact: boolean }) {
  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50/80 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/80">
          <ReviewStars rating={item.rating} />
        </div>
        <Quote className="h-8 w-8 text-zinc-200 dark:text-zinc-800" />
      </div>
      {item.htmlDescription ? (
        <div
          className="vbiz-review-body vcard-rich-html prose prose-sm mb-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: item.htmlDescription }}
        />
      ) : item.plainDescription ? (
        <p
          className={`vbiz-review-body mb-8 leading-relaxed font-medium italic ${
            compact ? 'text-sm' : 'text-lg md:text-xl'
          }`}
        >
          &ldquo;{item.plainDescription}&rdquo;
        </p>
      ) : null}
      {item.linkUrl ? (
        <Link
          href={item.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 inline-flex items-center gap-2 self-start text-sm font-bold text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          View Original Review <ExternalLink size={14} />
        </Link>
      ) : null}
      <div className="mt-auto flex items-center gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
        <ReviewAvatar imageUrl={item.image} alt={item.title || 'Reviewer'} className="h-12 w-12" />
        <div>
          <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{item.title}</p>
        </div>
      </div>
    </>
  )
}

export function AllReviewsView({ sectionTitle, slides, onBack }: AllReviewsViewProps) {
  /**
   * The editor phone preview is ~420px wide inside a desktop viewport, so `md:`/`lg:`
   * breakpoints would pick the wide layout. Drive layout off the frame instead.
   */
  const { embedded } = useProfileDisplay()
  const compact = embedded

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full pb-20"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <ArrowLeft size={16} />
        Back to {sectionTitle}
      </button>

      <div className="mb-8">
        <h2
          className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ${
            compact ? 'text-2xl' : 'text-3xl sm:text-4xl'
          }`}
        >
          All Reviews
        </h2>
        <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {slides.length} {slides.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      <div className={`vbiz-bento-grid grid grid-cols-1 gap-4 ${compact ? '' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
        {slides.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className={`flex min-h-70 flex-col rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50 ${
              compact ? 'p-4' : 'p-6 sm:p-8'
            }`}
          >
            <ReviewCardContent item={item} compact={compact} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export function SliderReviewCard({ item, compact = false }: { item: ReviewListItem; compact?: boolean }) {
  return (
    <>
      <div className={`mb-3 flex shrink-0 items-start justify-between ${compact ? '' : 'md:mb-6'}`}>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50/80 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/80">
          <ReviewStars rating={item.rating} className={`h-3.5 w-3.5 ${compact ? '' : 'md:h-4 md:w-4'}`} />
        </div>
        <Quote
          className={`h-7 w-7 text-zinc-200 transition-colors group-hover/card:text-zinc-300 dark:text-zinc-800 ${
            compact ? '' : 'md:h-8 md:w-8'
          }`}
        />
      </div>

      <div className={`mb-4 min-h-0 flex-1 overflow-hidden ${compact ? '' : 'md:mb-6'}`}>
        {item.htmlDescription ? (
          <div
            className={`vbiz-review-body vcard-rich-html prose prose-sm line-clamp-5 max-w-none text-sm leading-relaxed font-medium ${
              compact ? '' : 'sm:line-clamp-6 sm:text-base md:text-lg'
            }`}
            dangerouslySetInnerHTML={{ __html: item.htmlDescription }}
          />
        ) : item.plainDescription ? (
          <p
            className={`vbiz-review-body line-clamp-5 text-sm leading-relaxed font-medium italic ${
              compact ? '' : 'sm:line-clamp-6 sm:text-base md:text-lg'
            }`}
          >
            &ldquo;{item.plainDescription}&rdquo;
          </p>
        ) : null}
      </div>

      {/* Footer strip bleeds to the card edge — negative margins must match the card's padding. */}
      <div
        className={`relative z-10 mt-auto flex shrink-0 items-center gap-3 border-t border-zinc-200 bg-zinc-50/80 pt-4 pb-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/80 ${
          compact ? '-mx-4 -mb-4 px-4' : '-mx-6 -mb-6 px-6 md:-mx-8 md:-mb-8 md:gap-4 md:px-8 md:pt-6 md:pb-8'
        }`}
      >
        <ReviewAvatar
          imageUrl={item.image}
          alt={item.title || 'Reviewer'}
          className={`h-10 w-10 ${compact ? '' : 'md:h-12 md:w-12'}`}
          imageClassName="grayscale-30 transition-all duration-300 group-hover/card:grayscale-0"
        />
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ${
              compact ? '' : 'md:text-base'
            }`}
          >
            {item.title}
          </p>
          {item.linkUrl ? (
            <Link
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              View Original Review <ExternalLink size={12} />
            </Link>
          ) : null}
        </div>
      </div>
    </>
  )
}
