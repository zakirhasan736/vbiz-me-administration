'use client'

import { AllReviewsView, SliderReviewCard } from '@/profile-app/components/AllReviewsView'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetReviewsQuery } from '@/redux/api'
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
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const REVIEW_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&fit=crop'
const SKELETON_CARD_COUNT = 4

function ReviewsHeaderSkeleton() {
  return (
    <div className="relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[2rem] border border-zinc-200 bg-zinc-100 p-4 pb-12 md:min-h-[22vh] md:rounded-[2.5rem] md:p-6 md:pb-6 lg:col-span-4 lg:min-h-[24vh] dark:border-zinc-800/80 dark:bg-zinc-900">
      <div className="w-full space-y-3">
        <div className="h-6 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="hidden h-12 w-full max-w-xl animate-pulse rounded-lg bg-zinc-200 md:block dark:bg-zinc-800" />
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
      className="min-h-[280px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800"
    />
  )
}

export const ReviewsSection = () => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''

  const { data, isLoading, isError } = useGetReviewsQuery(profileId, { skip: !profileId })

  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('slider')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const slides = data?.slides ?? []
  const sectionTitle = data?.sectionTitle ?? 'Reviews'
  const leaveReviewUrl = data?.leaveReviewUrl ?? null
  const reviewCount = data?.reviewCount ?? 0
  const slideCount = slides.length
  const clampedActiveIndex = slideCount === 0 ? 0 : Math.min(activeIndex, slideCount - 1)

  const totalReviewsLabel =
    reviewCount >= 50 ? '50+' : reviewCount >= 20 ? '20+' : reviewCount >= 10 ? '10+' : reviewCount

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

  return (
    <div className="w-full overflow-hidden pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {showInitialLoader ? (
          <ReviewsHeaderSkeleton />
        ) : (
          <div className="group relative flex min-h-[200px] w-full flex-col overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#020914] shadow-xl md:min-h-[22vh] md:rounded-[2.5rem] lg:col-span-4 lg:min-h-[24vh] dark:border-[#eed677]/20">
            {/* Accent background (no video) */}
            <div className="absolute inset-0 z-0 h-full w-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(238,214,119,0.14),transparent_60%)]" />
              <div className="absolute inset-0 bg-linear-to-t from-[#020914] via-[#020914]/85 to-[#020914]/40" />
              <div className="absolute inset-0 hidden bg-linear-to-r from-[#020914] via-[#020914]/60 to-transparent md:block md:w-2/3" />
            </div>

            {/* View toggle — bottom-right on mobile, top-right on desktop */}
            <div className="absolute top-6 right-3 z-20 md:top-8 md:right-8 md:bottom-auto lg:top-8 lg:right-10">
              <div className="inline-flex items-center rounded-xl border border-zinc-800 bg-black/50 p-0.5 shadow-2xl backdrop-blur-xl md:p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  aria-label="Slider view"
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all duration-300 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs ${
                    viewMode === 'slider' ? 'bg-[#eed677] text-black shadow-sm' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <Monitor size={12} className="md:h-3.5 md:w-3.5" />
                  <span className="hidden sm:inline">Slider</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all duration-300 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs ${
                    viewMode === 'grid' ? 'bg-[#eed677] text-black shadow-sm' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <LayoutGrid size={12} className="md:h-3.5 md:w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>

            {/* Content overlay */}
            <div className="relative z-10 flex h-full w-full grow flex-col justify-end p-0 pb-0 sm:p-5 md:p-6 md:pb-6 lg:p-7">
              <div className="mt-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 md:flex-row md:items-end md:gap-5">
                <div className="flex max-w-2xl flex-col gap-1.5 md:gap-2">
                  <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#eed677]/30 bg-[#eed677]/10 px-2.5 py-1 text-[9px] font-bold tracking-widest text-[#eed677] uppercase shadow-sm backdrop-blur-md md:text-xs">
                    <Star size={12} className="text-[#eed677]" /> {sectionTitle}
                  </div>

                  <h2 className="text-2xl leading-[1.1] font-black tracking-tight text-white sm:text-3xl md:text-4xl lg:text-4xl">
                    Trusted by{' '}
                    <span className="bg-linear-to-r from-[#eed677] to-yellow-500 bg-clip-text text-transparent italic">
                      Professionals
                    </span>
                  </h2>
                  <p className="hidden max-w-xl text-sm leading-normal font-medium text-zinc-300 md:block md:text-lg">
                    Read what clients and partners are saying about working together — or leave your own review.
                  </p>
                </div>

                <div className="flex w-full shrink-0 flex-col items-stretch gap-2 md:w-auto md:items-end md:gap-3">
                  <div className="flex w-full flex-row items-center justify-between gap-2 rounded-xl border border-zinc-800/80 bg-black/30 p-2 backdrop-blur-md md:w-auto md:flex-col md:items-end md:gap-2 md:rounded-2xl md:p-5">
                    <div className="flex min-w-0 flex-col">
                      <div className="flex gap-0.5 md:gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-[#eed677] text-[#eed677] drop-shadow-[0_0_8px_rgba(238,214,119,0.4)] md:h-5 md:w-5"
                          />
                        ))}
                      </div>
                      <span className="mt-0.5 text-[8px] font-bold tracking-wider text-zinc-400 uppercase md:mt-1 md:text-[10px]">
                        {totalReviewsLabel} Verified Reviews
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1 md:gap-2">
                      <span className="text-sm font-black text-white md:text-3xl">5.0</span>
                      <span className="text-[9px] font-medium text-zinc-500 md:text-sm">/ 5.0</span>
                    </div>
                  </div>

                  {leaveReviewUrl ? (
                    <Link
                      href={leaveReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 flex w-full max-w-[calc(100%-3.5rem)] items-center justify-center gap-2 rounded-xl bg-[#eed677] px-3 py-2 text-[11px] font-bold text-zinc-950 shadow-lg shadow-yellow-500/10 transition-all hover:bg-yellow-500 active:scale-95 md:max-w-none md:px-6 md:py-3 md:text-xs"
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

      {isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load reviews right now. Please try again later.
        </div>
      ) : null}

      {showEmptyState ? (
        <div className="rounded-3xl border border-zinc-200 bg-white/50 px-6 py-12 text-center backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No reviews have been published yet.</p>
        </div>
      ) : null}

      {showInitialLoader ? (
        <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
            <ReviewGridCardSkeleton key={idx} idx={idx} />
          ))}
        </div>
      ) : null}

      {!showInitialLoader && slideCount > 0 && viewMode === 'grid' ? (
        <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {slides.map((item, idx) => {
            const isFeatured = idx === 0 || idx === 3

            if (item.isLinkCard && item.linkUrl) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  key={item.id}
                  className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl sm:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 ${isFeatured ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'}`}
                >
                  <Link href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-700/50">
                        <Image
                          width={100}
                          height={100}
                          src={item.image || REVIEW_IMAGE_FALLBACK}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                    </div>
                    {item.htmlDescription ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none flex-1"
                        dangerouslySetInnerHTML={{ __html: item.htmlDescription }}
                      />
                    ) : null}
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      Open review page <ExternalLink size={14} />
                    </span>
                  </Link>
                </motion.div>
              )
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={item.id}
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 sm:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 ${isFeatured ? 'bg-linear-to-br from-white to-zinc-50 md:col-span-2 lg:col-span-2 dark:from-zinc-900/80 dark:to-zinc-900/40' : 'col-span-1'}`}
              >
                <div className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 rounded-full bg-[#eab308]/10 p-24 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100 dark:bg-[#eab308]/5" />

                <div className="relative z-10 w-full">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex gap-1.5 rounded-lg border border-zinc-200/50 bg-zinc-50/50 p-1.5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-950/50">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-[#eab308] text-[#eab308]" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-zinc-200 transition-colors group-hover:text-zinc-300 dark:text-zinc-800 dark:group-hover:text-zinc-700" />
                  </div>
                  {item.htmlDescription ? (
                    <div
                      className={`prose prose-sm dark:prose-invert mb-8 max-w-none ${isFeatured ? 'prose-lg' : ''}`}
                      dangerouslySetInnerHTML={{ __html: item.htmlDescription }}
                    />
                  ) : (
                    <p
                      className={`mb-8 leading-relaxed font-medium text-zinc-700 italic transition-colors group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100 ${isFeatured ? 'text-xl md:text-2xl' : 'text-base'}`}
                    >
                      &ldquo;{item.plainDescription}&rdquo;
                    </p>
                  )}
                </div>

                <div className="relative z-10 mt-auto flex items-center gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
                  <div
                    className={`shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 shadow-sm dark:border-zinc-700/50 ${isFeatured ? 'h-14 w-14' : 'h-10 w-10'}`}
                  >
                    <Image
                      width={100}
                      height={100}
                      src={item.image || REVIEW_IMAGE_FALLBACK}
                      alt={item.title}
                      className="h-full w-full object-cover grayscale-30 transition-all duration-300 group-hover:grayscale-0"
                    />
                  </div>
                  <div>
                    <p className={`font-bold text-zinc-900 dark:text-zinc-100 ${isFeatured ? 'text-base' : 'text-sm'}`}>
                      {item.title}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : null}

      {!showInitialLoader && slideCount > 0 && viewMode === 'slider' ? (
        <div className="relative z-20 mt-6 mb-8 flex min-h-[380px] w-full flex-1 flex-col items-center justify-center perspective-[1600px] md:mt-12 md:min-h-[480px]">
          {/* Desktop floating arrows */}
          <div className="pointer-events-none absolute top-1/2 z-40 hidden w-full max-w-[1080px] -translate-y-1/2 justify-between px-2 md:flex">
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
            className="transform-style-3d relative flex w-full max-w-[1000px] cursor-grab items-center justify-center select-none active:cursor-grabbing"
            style={{ height: isMobile ? '310px' : '410px' }}
          >
            <AnimatePresence initial={false}>
              {slides.map((item, idx) => {
                const offset = idx - clampedActiveIndex
                const absOffset = Math.abs(offset)
                const direction = Math.sign(offset)

                if (absOffset > 2) return null

                const cardWidth = isMobile ? 290 : 420
                const cardHeight = isMobile ? 300 : 400

                const xTranslate =
                  offset === 0 ? 0 : direction * (absOffset * (isMobile ? 50 : 140) + (isMobile ? 20 : 80))
                const zTranslate = offset === 0 ? (isMobile ? 35 : 80) : -absOffset * (isMobile ? 50 : 110)
                const yRotate = offset === 0 ? 0 : direction * (isMobile ? -12 : -20)
                const scale =
                  absOffset === 0 ? 1 : Math.max(isMobile ? 0.8 : 0.75, 1 - absOffset * (isMobile ? 0.08 : 0.12))
                const zIndex = 50 - absOffset
                const opacity = absOffset === 2 ? 0.6 : 1

                return (
                  <motion.div
                    key={item.id}
                    onMouseMove={(e) => {
                      if (isMobile) return
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
                    onClick={() => {
                      if (absOffset !== 0 && !isTransitioning) {
                        setIsTransitioning(true)
                        setActiveIndex(idx)
                        setTimeout(() => setIsTransitioning(false), 350)
                      }
                    }}
                    className="transform-style-3d group/card absolute flex cursor-pointer flex-col justify-between overflow-hidden rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-2xl transition-all duration-300 md:p-8 dark:border-zinc-800 dark:bg-zinc-900"
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
                          <Loader2 size={isMobile ? 24 : 32} className="animate-spin text-[#eed677]" />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(100,100,100,0.1)' }}
                      className="pointer-events-none absolute inset-0 z-30 rounded-[2rem] mix-blend-multiply transition-colors duration-500 dark:mix-blend-normal"
                    />
                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(24,24,27,0.72)' }}
                      className="pointer-events-none absolute inset-0 z-30 hidden rounded-[2rem] transition-colors duration-500 dark:block"
                    />

                    <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 translate-x-[var(--mouse-x,0px)] translate-y-[var(--mouse-y,0px)] rounded-full bg-[#eed677]/10 p-32 blur-3xl transition-transform duration-700 dark:bg-[#eed677]/5" />

                    <div className="relative z-10 flex h-full flex-col">
                      <SliderReviewCard item={item} />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Controller — prev / dots / next. On mobile it sits above the cards. */}
          <div className="order-first mb-5 flex w-full max-w-[420px] shrink-0 items-center justify-between px-4 select-none md:order-none md:mt-6 md:mb-0">
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
