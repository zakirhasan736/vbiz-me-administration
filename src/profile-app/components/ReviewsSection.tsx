'use client'

import { sanitizeReviewUrl } from '@/lib/api/reviews/mapReviews'
import { AllReviewsView, SliderReviewCard } from '@/profile-app/components/AllReviewsView'
import { ReviewAvatar } from '@/profile-app/components/ReviewAvatar'
import { contentGridClass } from '@/profile-app/lib/contentGridClass'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { openExternalInNewTab } from '@/profile-app/lib/profileExternalLinks'
import { useResolvedSectionTitle, useSectionBanner } from '@/profile-app/lib/sectionTitleContext'
import { SectionBannerNotes, V3ErrorState, V3PreviewAwareText } from '@/profile-app/sections'
import { useGetReviewsQuery } from '@/redux/api'
import { cn } from '@/utils/cn'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Monitor,
  Quote,
  Star,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'

function openReviewLink(url: string | null | undefined, event?: MouseEvent | KeyboardEvent) {
  if (!url) return
  event?.preventDefault()
  event?.stopPropagation()
  openExternalInNewTab(url)
}

const SKELETON_CARD_COUNT = 4

function ReviewsHeaderSkeleton({ compact }: { compact: boolean }) {
  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden rounded-4xl border border-zinc-200 bg-zinc-100 p-3 lg:col-span-4 dark:border-zinc-800/80 dark:bg-zinc-900 ${
        compact ? 'min-h-36' : 'min-h-36 md:min-h-0 md:rounded-[2rem] md:p-4'
      }`}
    >
      <div className="w-full space-y-2">
        <div className="h-5 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-7 w-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

function ReviewGridCardSkeleton({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.05 }}
      className="min-h-70 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800"
    />
  )
}

export const ReviewsSection = () => {
  const { cardOwnerId, embedded } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''

  /**
   * The editor phone preview is ~420px wide inside a desktop viewport, so `md:`/`lg:`
   * breakpoints would pick the wide layout. Drive layout off the frame instead.
   */
  const compact = embedded

  const { data, isLoading, isError } = useGetReviewsQuery(profileId, { skip: !profileId })

  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('slider')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const slides = data?.slides ?? []
  const sectionTitle = useResolvedSectionTitle(data?.sectionTitle, 'Reviews')
  const banner = useSectionBanner({
    fallbackTitle: sectionTitle,
    fallbackDescription: 'Read what clients and partners are saying about working together — or leave your own review.',
  })
  const leaveReviewUrl = sanitizeReviewUrl(banner.leaveReviewUrl) || data?.leaveReviewUrl || null
  const reviewCount = data?.reviewCount ?? 0
  const averageRating = data?.averageRating ?? 0
  const slideCount = slides.length
  const clampedActiveIndex = slideCount === 0 ? 0 : Math.min(activeIndex, slideCount - 1)

  /** Phone-sized layout: a real mobile viewport or the editor preview frame. */
  const isNarrow = compact || isMobile

  const totalReviewsLabel =
    reviewCount >= 50 ? '50+' : reviewCount >= 20 ? '20+' : reviewCount >= 10 ? '10+' : reviewCount
  const averageLabel = averageRating > 0 ? averageRating.toFixed(1) : '0.0'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nextReview = () => {
    if (isTransitioning || slideCount === 0) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev + 1) % slideCount)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const prevReview = () => {
    if (isTransitioning || slideCount === 0) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev - 1 + slideCount) % slideCount)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  // Autoplay — resets whenever the active slide or view mode changes.
  useEffect(() => {
    if (viewMode !== 'slider' || slideCount <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount)
    }, 5000)
    return () => clearInterval(interval)
  }, [viewMode, activeIndex, slideCount])

  if (!profileId) return null

  if (showAllReviews) {
    return <AllReviewsView sectionTitle={sectionTitle} slides={slides} onBack={() => setShowAllReviews(false)} />
  }

  const showInitialLoader = isLoading && slideCount === 0
  const showEmptyState = !isLoading && !isError && slideCount === 0

  const viewToggle = (
    <div
      className={`inline-flex items-center rounded-xl border border-zinc-800 bg-black/50 p-0.5 shadow-2xl backdrop-blur-xl ${compact ? 'shadow-md' : 'md:p-1'}`}
    >
      <button
        type="button"
        onClick={() => setViewMode('slider')}
        aria-label="Slider view"
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all duration-300 ${
          compact ? '' : 'md:gap-1.5 md:px-3 md:py-1.5 md:text-xs'
        } ${viewMode === 'slider' ? 'bg-[#eed677] text-black shadow-sm' : 'text-zinc-300 hover:text-white'}`}
      >
        <Monitor size={12} className={compact ? '' : 'md:h-3.5 md:w-3.5'} />
        <span className={compact ? '' : 'hidden sm:inline'}>Slider</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        aria-label="Grid view"
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all duration-300 ${
          compact ? '' : 'md:gap-1.5 md:px-3 md:py-1.5 md:text-xs'
        } ${viewMode === 'grid' ? 'bg-[#eed677] text-black shadow-sm' : 'text-zinc-300 hover:text-white'}`}
      >
        <LayoutGrid size={12} className={compact ? '' : 'md:h-3.5 md:w-3.5'} />
        <span className={compact ? '' : 'hidden sm:inline'}>Grid</span>
      </button>
    </div>
  )

  return (
    <div className="w-full overflow-hidden pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {showInitialLoader ? (
          <ReviewsHeaderSkeleton compact={compact} />
        ) : (
          <div
            className={`vbiz-section-banner group relative flex w-full flex-col overflow-hidden rounded-4xl border shadow-xl lg:col-span-4 ${
              compact ? '' : 'md:rounded-[2rem]'
            }`}
          >
            {/* Soft wash over Pages Header gradient */}
            <div className="absolute inset-0 z-0 h-full w-full">
              <div className="bg-gold/10 pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,color-mix(in_srgb,var(--vbiz-accent,#eed677)_14%,transparent),transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
            </div>

            {/* Content overlay */}
            <div
              className={`relative z-10 flex h-full w-full grow flex-col justify-end ${
                compact ? 'gap-2 p-3' : 'p-3 sm:p-4 md:p-4'
              }`}
            >
              <div
                className={`mt-auto flex w-full max-w-7xl flex-col items-start justify-between ${
                  compact ? 'gap-2.5' : 'gap-2.5 md:flex-row md:items-end md:gap-4'
                }`}
              >
                <div className="flex max-w-2xl flex-col gap-1">
                  <div
                    className={`inline-flex items-center gap-1.5 self-start rounded-full border border-[#eed677]/30 bg-[#eed677]/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-[#eed677] uppercase shadow-sm backdrop-blur-md ${
                      compact ? '' : 'md:text-[10px]'
                    }`}
                  >
                    <Star size={11} className="vbiz-review-star text-[#eed677]" /> {sectionTitle}
                  </div>

                  {banner.title ? (
                    <h2
                      className={`leading-[1.1] font-black tracking-tight text-white ${
                        compact ? 'text-xl' : 'text-xl sm:text-2xl md:text-3xl'
                      }`}
                    >
                      {banner.title}
                    </h2>
                  ) : null}
                  {banner.description ? (
                    <p
                      className={`max-w-xl text-sm leading-snug font-medium text-zinc-300 ${
                        compact ? 'hidden' : 'hidden md:line-clamp-2 md:block md:text-sm'
                      }`}
                    >
                      {banner.description}
                    </p>
                  ) : null}
                  <SectionBannerNotes notes={banner.notes} />
                </div>

                <div
                  className={`flex w-full shrink-0 flex-col items-stretch gap-2 ${
                    compact ? '' : 'md:w-auto md:items-end md:gap-2'
                  }`}
                >
                  <div className="flex w-full justify-end">{viewToggle}</div>
                  <div
                    className={`inline-flex w-full flex-row items-center justify-between gap-2 rounded-xl border border-zinc-800/80 bg-black/30 px-2.5 py-1.5 backdrop-blur-md ${
                      compact ? '' : 'md:w-auto md:justify-start md:gap-2 md:rounded-xl md:px-3 md:py-1.5'
                    }`}
                  >
                    <div className="inline-flex min-w-0 items-center gap-1.5">
                      <Star
                        className="vbiz-review-star h-3.5 w-3.5 shrink-0 fill-[#eed677] text-[#eed677] drop-shadow-[0_0_8px_rgba(238,214,119,0.4)]"
                        aria-hidden
                      />
                      <span className={`font-black text-white ${compact ? 'text-sm' : 'text-sm md:text-base'}`}>
                        {averageLabel}
                      </span>
                      <span
                        className={`truncate text-[9px] font-bold tracking-wider text-zinc-400 uppercase ${
                          compact ? '' : 'md:text-[10px]'
                        }`}
                      >
                        · {totalReviewsLabel} Verified Reviews
                      </span>
                    </div>
                  </div>

                  {leaveReviewUrl ? (
                    <Link
                      href={leaveReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative z-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#eed677] px-3 py-1.5 text-[11px] font-bold text-zinc-950 shadow-lg shadow-yellow-500/10 transition-all hover:bg-yellow-500 active:scale-95 ${
                        compact ? '' : 'max-w-[calc(100%-3.5rem)] md:max-w-none md:px-4 md:py-2 md:text-xs'
                      }`}
                    >
                      <span>Leave a Review</span>
                      <MessageCircle size={14} />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isError ? <V3ErrorState sectionTitle="Reviews" /> : null}

      {showEmptyState ? (
        <div className="rounded-3xl border border-zinc-200 bg-white/50 px-6 py-12 text-center backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <V3PreviewAwareText published="No reviews have been published yet." />
          </p>
        </div>
      ) : null}

      {showInitialLoader ? (
        <div
          className={`vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 ${
            compact ? '' : 'md:grid-cols-3 lg:grid-cols-4'
          }`}
        >
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
            <ReviewGridCardSkeleton key={idx} idx={idx} />
          ))}
        </div>
      ) : null}

      {!showInitialLoader && slideCount > 0 && viewMode === 'grid' ? (
        <div
          className={cn(
            'vbiz-bento-grid relative z-20 mt-4',
            contentGridClass(slideCount, compact ? '' : 'md:grid-cols-3 lg:grid-cols-4')
          )}
        >
          {slides.map((item, idx) => {
            const isFeatured = idx === 0 || idx === 3
            const hasLink = Boolean(item.linkUrl)

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={item.id}
                role={hasLink ? 'link' : undefined}
                tabIndex={hasLink ? 0 : undefined}
                aria-label={hasLink ? `Open original review by ${item.title || 'reviewer'}` : undefined}
                onClick={(event) => {
                  if (hasLink) openReviewLink(item.linkUrl, event)
                }}
                onKeyDown={(event) => {
                  if (!hasLink) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    openReviewLink(item.linkUrl, event)
                  }
                }}
                className={`vbiz-review-card group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 ${
                  hasLink ? 'cursor-pointer' : ''
                } ${
                  compact
                    ? `col-span-1 p-4 ${isFeatured ? 'bg-linear-to-br from-white to-zinc-50 dark:from-zinc-900/80 dark:to-zinc-900/40' : ''}`
                    : `p-6 sm:p-8 ${isFeatured ? 'bg-linear-to-br from-white to-zinc-50 md:col-span-2 lg:col-span-2 dark:from-zinc-900/80 dark:to-zinc-900/40' : 'col-span-1'}`
                }`}
              >
                <div className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 rounded-full bg-[color-mix(in_srgb,var(--vbiz-review-star,var(--vbiz-accent))_10%,transparent)] p-24 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />

                <div className="relative z-10 w-full">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex gap-1.5 rounded-lg border border-zinc-200/50 bg-zinc-50/50 p-1.5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-950/50">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`vbiz-review-star h-4 w-4 ${
                            i <= item.rating ? 'fill-[#eab308] text-[#eab308]' : 'text-zinc-300 dark:text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-zinc-200 transition-colors group-hover:text-zinc-300 dark:text-zinc-800 dark:group-hover:text-zinc-700" />
                  </div>
                  {item.htmlDescription ? (
                    <div
                      className={`vbiz-review-body vcard-rich-html prose prose-sm mb-8 max-w-none ${isFeatured && !compact ? 'prose-lg' : ''}`}
                      dangerouslySetInnerHTML={{ __html: item.htmlDescription }}
                    />
                  ) : (
                    <p
                      className={`vbiz-review-body mb-8 leading-relaxed font-medium italic ${
                        compact ? 'text-sm' : isFeatured ? 'text-xl md:text-2xl' : 'text-base'
                      }`}
                    >
                      &ldquo;{item.plainDescription}&rdquo;
                    </p>
                  )}
                </div>

                <div className="relative z-10 mt-auto flex items-center gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
                  <ReviewAvatar
                    imageUrl={item.image}
                    alt={item.title || 'Reviewer'}
                    className={isFeatured ? 'h-14 w-14 shadow-sm' : 'h-10 w-10 shadow-sm'}
                    imageClassName="grayscale-30 transition-all duration-300 group-hover:grayscale-0"
                  />
                  <div className="min-w-0 flex-1">
                    {item.title.trim() ? (
                      <p
                        className={`vbiz-review-user-name font-bold text-zinc-900 dark:text-zinc-100 ${isFeatured ? 'text-base' : 'text-sm'}`}
                      >
                        {item.title}
                      </p>
                    ) : null}
                    {item.linkUrl ? (
                      <span className="vbiz-review-user-meta mt-1 inline-flex items-center gap-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        View Original Review <ExternalLink size={12} />
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : null}

      {!showInitialLoader && slideCount > 0 && viewMode === 'slider' ? (
        <div
          className={`relative z-20 mt-6 mb-8 flex w-full flex-1 flex-col items-center justify-center perspective-[1600px] ${
            compact ? 'min-h-87.5' : 'min-h-95 md:mt-12 md:min-h-120'
          }`}
        >
          {/* Desktop floating arrows */}
          <div
            className={`pointer-events-none absolute top-1/2 z-40 w-full max-w-270 -translate-y-1/2 justify-between px-2 ${
              compact ? 'hidden' : 'hidden md:flex'
            }`}
          >
            <button
              type="button"
              onClick={prevReview}
              aria-label="Previous review"
              className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-900 shadow-lg backdrop-blur-md transition-all hover:border-[#eed677] hover:bg-[#eed677] hover:text-black active:scale-95 dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:border-[#eed677] dark:hover:bg-[#eed677] dark:hover:text-black"
            >
              <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={nextReview}
              aria-label="Next review"
              className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-900 shadow-lg backdrop-blur-md transition-all hover:border-[#eed677] hover:bg-[#eed677] hover:text-black active:scale-95 dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:border-[#eed677] dark:hover:bg-[#eed677] dark:hover:text-black"
            >
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Draggable 3D card stack */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_e, info) => {
              const threshold = 55
              if (info.offset.x < -threshold) nextReview()
              else if (info.offset.x > threshold) prevReview()
            }}
            className="transform-style-3d relative flex w-full max-w-250 cursor-grab items-center justify-center select-none active:cursor-grabbing"
            style={{ height: isNarrow ? '310px' : '410px' }}
          >
            <AnimatePresence initial={false}>
              {slides.map((item, idx) => {
                const offset = idx - clampedActiveIndex
                const absOffset = Math.abs(offset)
                const direction = Math.sign(offset)

                if (absOffset > 2) return null

                const cardWidth = isNarrow ? 290 : 420
                const cardHeight = isNarrow ? 300 : 400

                const xTranslate =
                  offset === 0 ? 0 : direction * (absOffset * (isNarrow ? 50 : 140) + (isNarrow ? 20 : 80))
                const zTranslate = offset === 0 ? (isNarrow ? 35 : 80) : -absOffset * (isNarrow ? 50 : 110)
                const yRotate = offset === 0 ? 0 : direction * (isNarrow ? -12 : -20)
                const scale =
                  absOffset === 0 ? 1 : Math.max(isNarrow ? 0.8 : 0.75, 1 - absOffset * (isNarrow ? 0.08 : 0.12))
                const zIndex = 50 - absOffset
                const opacity = absOffset === 2 ? 0.6 : 1

                return (
                  <motion.div
                    key={item.id}
                    onMouseMove={(e) => {
                      if (isNarrow) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      e.currentTarget.style.setProperty('--mouse-x', `${(x / rect.width - 0.5) * -12}px`)
                      e.currentTarget.style.setProperty('--mouse-y', `${(y / rect.height - 0.5) * -12}px`)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.setProperty('--mouse-x', '0px')
                      e.currentTarget.style.setProperty('--mouse-y', '0px')
                    }}
                    initial={false}
                    animate={{ x: xTranslate, z: zTranslate, rotateY: yRotate, scale, zIndex, opacity }}
                    transition={{ type: 'spring', damping: 24, stiffness: 160 }}
                    role={item.linkUrl && absOffset === 0 ? 'link' : undefined}
                    tabIndex={item.linkUrl && absOffset === 0 ? 0 : undefined}
                    aria-label={
                      item.linkUrl && absOffset === 0
                        ? `Open original review by ${item.title || 'reviewer'}`
                        : undefined
                    }
                    onClick={() => {
                      if (absOffset !== 0 && !isTransitioning) {
                        setIsTransitioning(true)
                        setActiveIndex(idx)
                        setTimeout(() => setIsTransitioning(false), 350)
                        return
                      }
                      if (absOffset === 0 && item.linkUrl) {
                        openReviewLink(item.linkUrl)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (absOffset !== 0 || !item.linkUrl) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        openReviewLink(item.linkUrl, event)
                      }
                    }}
                    className={`vbiz-review-card transform-style-3d group/card absolute flex cursor-pointer flex-col justify-between overflow-hidden rounded-4xl border border-zinc-200 bg-white shadow-2xl transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 ${
                      compact ? 'p-4' : 'p-6 md:p-8'
                    }`}
                    style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                  >
                    <AnimatePresence>
                      {isTransitioning && absOffset === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-white/45 backdrop-blur-[2px] dark:bg-zinc-950/45"
                        >
                          <Loader2 size={isNarrow ? 24 : 32} className="animate-spin text-[#eed677]" />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(100,100,100,0.1)' }}
                      className="pointer-events-none absolute inset-0 z-30 rounded-4xl mix-blend-multiply transition-colors duration-500 dark:mix-blend-normal"
                    />
                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(24,24,27,0.72)' }}
                      className="pointer-events-none absolute inset-0 z-30 hidden rounded-4xl transition-colors duration-500 dark:block"
                    />

                    <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 translate-x-(--mouse-x,0px) translate-y-(--mouse-y,0px) rounded-full bg-[#eed677]/10 p-32 blur-3xl transition-transform duration-700 dark:bg-[#eed677]/5" />

                    <div className="relative z-10 flex h-full flex-col">
                      <SliderReviewCard item={item} compact={compact} />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Controller — prev / dots / next. On mobile it sits above the cards. */}
          <div
            className={`order-first mb-5 flex w-full max-w-105 shrink-0 items-center justify-between px-4 select-none ${
              compact ? '' : 'md:order-0 md:mt-6 md:mb-0'
            }`}
          >
            <button
              type="button"
              onClick={prevReview}
              aria-label="Previous review"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-800 transition-all hover:bg-[#eed677] hover:text-zinc-950 active:scale-90 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-[#eed677] dark:hover:text-zinc-950"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="no-scrollbar flex max-w-[60%] items-center gap-1.5 overflow-x-auto scroll-smooth py-1.5">
              {slides.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!isTransitioning) {
                      setIsTransitioning(true)
                      setActiveIndex(idx)
                      setTimeout(() => setIsTransitioning(false), 350)
                    }
                  }}
                  aria-label={`Go to review ${idx + 1}`}
                  className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${
                    idx === clampedActiveIndex
                      ? 'w-5 bg-[#eed677]'
                      : 'w-1.5 bg-zinc-400 hover:bg-zinc-500 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextReview}
              aria-label="Next review"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-800 transition-all hover:bg-[#eed677] hover:text-zinc-950 active:scale-90 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-[#eed677] dark:hover:text-zinc-950"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : null}

      {slideCount > 0 ? (
        <div className="relative z-20 mt-8 mb-8 flex w-full justify-center border-t border-zinc-200 pt-8 dark:border-zinc-800/50">
          <button
            type="button"
            onClick={() => setShowAllReviews(true)}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-zinc-200 bg-white/50 px-8 py-3.5 text-sm font-bold text-zinc-900 shadow-sm backdrop-blur-md transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-black/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full dark:via-white/5" />
            View All Reviews{' '}
            <ArrowRight
              size={16}
              className="text-zinc-500 transition-all group-hover:translate-x-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
            />
          </button>
        </div>
      ) : null}
    </div>
  )
}
