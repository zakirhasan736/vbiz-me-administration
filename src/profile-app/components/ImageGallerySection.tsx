'use client'

import type { GalleryListItem } from '@/interfaces/api/gallery.interface'
import { useDragScroll } from '@/profile-app/hooks/useDragScroll'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetGalleryQuery } from '@/redux/api'
import { Camera, Image as ImageIcon, Maximize2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { createPortal } from 'react-dom'

const SKELETON_CARD_COUNT = 5

type HoverDirection = 'top' | 'right' | 'bottom' | 'left'

const OVERLAY_MOTION: Record<
  HoverDirection,
  { initial: { x?: string; y?: string }; animate: { x: string; y: string }; exit: { x?: string; y?: string } }
> = {
  top: { initial: { y: '-100%' }, animate: { x: '0%', y: '0%' }, exit: { y: '-100%' } },
  bottom: { initial: { y: '100%' }, animate: { x: '0%', y: '0%' }, exit: { y: '100%' } },
  left: { initial: { x: '-100%' }, animate: { x: '0%', y: '0%' }, exit: { x: '-100%' } },
  right: { initial: { x: '100%' }, animate: { x: '0%', y: '0%' }, exit: { x: '100%' } },
}

function getHoverDirection(event: React.MouseEvent<HTMLElement>, element: HTMLElement): HoverDirection {
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const top = y
  const bottom = rect.height - y
  const left = x
  const right = rect.width - x
  const min = Math.min(top, bottom, left, right)

  if (min === top) return 'top'
  if (min === bottom) return 'bottom'
  if (min === left) return 'left'
  return 'right'
}

function getGalleryGridClass(idx: number): string {
  const pos = idx % 5
  if (pos < 3) return 'col-span-1 md:col-span-2'
  return 'col-span-1 md:col-span-3'
}

function ImageWithPlaceholder({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={`relative ${className ?? ''} overflow-hidden`}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-xl"
          >
            <div className="absolute inset-0 animate-pulse bg-linear-to-tr from-white/5 to-transparent" />
            <ImageIcon size={32} className="vbiz-pin opacity-40" />
          </motion.div>
        )}
      </AnimatePresence>
      <Image
        width={800}
        height={600}
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

function GalleryCardSkeleton({ delay, className }: { delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={`vbiz-card aspect-4/3 w-full animate-pulse overflow-hidden rounded-sm border ${className ?? ''}`}
    />
  )
}

function GalleryCard({
  item,
  idx,
  onOpen,
}: {
  item: GalleryListItem
  idx: number
  onOpen: (item: GalleryListItem) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [direction, setDirection] = useState<HoverDirection>('top')

  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    setDirection(getHoverDirection(event, cardRef.current))
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    setDirection(getHoverDirection(event, cardRef.current))
    setIsHovered(false)
  }, [])

  const motionProps = OVERLAY_MOTION[direction]

  return (
    <motion.div
      layout
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.32, 0.72, 0, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`vbiz-card group relative aspect-4/3 w-full overflow-hidden rounded-sm border shadow-sm ${getGalleryGridClass(idx)}`}
    >
      <ImageWithPlaceholder src={item.imageUrl} alt={item.title} className="relative z-0 h-full w-full" />

      <AnimatePresence>
        {isHovered ? (
          <motion.div
            key="overlay"
            initial={motionProps.initial}
            animate={motionProps.animate}
            exit={motionProps.exit}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="vbiz-card-overlay absolute inset-0 z-30 flex flex-col p-4"
          >
            <div className="vbiz-card-pill vbiz-on-light-surface inline-flex w-fit max-w-[85%] rounded-sm px-3 py-1.5 shadow-sm">
              <p className="truncate text-sm font-bold tracking-tight">{item.title}</p>
            </div>

            <div className="mt-auto flex justify-end">
              <button
                type="button"
                aria-label={`View full size image: ${item.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen(item)
                }}
                className="vbiz-card-action flex h-10 w-10 shrink-0 items-center justify-center rounded-sm shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                <Maximize2 size={18} strokeWidth={2.25} />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function GalleryLightbox({ item, onClose }: { item: GalleryListItem; onClose: () => void }) {
  const isClient = useIsClient()
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!isClient) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="vbiz-modal-backdrop fixed inset-0 z-200 flex items-center justify-center px-4 pt-16 pb-28 backdrop-blur-sm sm:px-6 sm:pt-20 sm:pb-32"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} full size preview`}
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="vbiz-modal-close absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border sm:top-6 sm:right-6"
      >
        <X size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="vbiz-modal-panel relative flex max-h-[calc(100dvh-9rem)] max-w-[min(900px,90vw)] flex-col overflow-hidden rounded-lg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.title} className="max-h-[calc(100dvh-11rem)] w-full object-contain" />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-5 py-4">
          <p className="vbiz-title text-base font-bold text-white">{item.title}</p>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export const ImageGallerySection = () => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const [activeTab, setActiveTab] = useState('All')
  const [previewItem, setPreviewItem] = useState<GalleryListItem | null>(null)
  const scrollRef = useDragScroll<HTMLDivElement>()

  const { data, isLoading, isError } = useGetGalleryQuery(profileId, { skip: !profileId })

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const sectionTitle = data?.sectionTitle ?? 'Gallery'
  const categories = useMemo(() => {
    const titles = [...new Set(items.map((item) => item.title).filter(Boolean))]
    return titles.length > 1 ? ['All', ...titles] : ['All']
  }, [items])

  const filteredItems = activeTab === 'All' ? items : items.filter((item) => item.title === activeTab)

  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0
  const showFilters = categories.length > 1

  if (!profileId) return null

  if (showInitialLoader) {
    return (
      <div className="w-full pb-20">
        <SectionHeader sectionTitle={sectionTitle} isLoading showFilters={false} />
        <div className="vbiz-bento-grid relative z-20 grid w-full grid-cols-2 gap-3 pt-2 md:grid-cols-6 md:gap-4">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
            <GalleryCardSkeleton key={idx} delay={idx * 0.04} className={getGalleryGridClass(idx)} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full pb-20">
        <SectionHeader sectionTitle={sectionTitle} showFilters={false} />
        <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load gallery right now. Please try again later.
        </div>
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="vbiz-card flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed p-10 text-center">
          <div className="vbiz-pill-icon mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border">
            <Camera size={24} />
          </div>
          <h2 className="vbiz-title mb-3 text-2xl font-bold tracking-tight">{sectionTitle}</h2>
          <p className="vbiz-description max-w-md text-sm leading-relaxed font-medium">
            No gallery images have been published yet. Add content from the vCard editor Gallery tab.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <SectionHeader
        sectionTitle={sectionTitle}
        showFilters={showFilters}
        categories={categories}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scrollRef={scrollRef}
      />

      <motion.div
        layout
        className="vbiz-bento-grid relative z-20 grid w-full grid-cols-2 gap-3 pt-2 md:grid-cols-6 md:gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => (
            <GalleryCard key={`${item.id}-${item.createdAt}`} item={item} idx={idx} onOpen={setPreviewItem} />
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {previewItem ? <GalleryLightbox item={previewItem} onClose={() => setPreviewItem(null)} /> : null}
      </AnimatePresence>
    </div>
  )
}

function SectionHeader({
  sectionTitle,
  isLoading,
  showFilters,
  categories = ['All'],
  activeTab = 'All',
  onTabChange,
  scrollRef,
}: {
  sectionTitle: string
  isLoading?: boolean
  showFilters: boolean
  categories?: string[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  scrollRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="mb-3 grid grid-cols-1 gap-4 md:mb-4 lg:grid-cols-4">
      <div className="vbiz-section-banner group relative flex flex-col items-start justify-between gap-2 overflow-hidden rounded-3xl border p-4 backdrop-blur-xl md:flex-row md:items-end md:gap-0 md:p-6 lg:col-span-4 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
        <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

        <div className="relative z-10 flex w-full flex-col gap-1 md:w-auto md:gap-2">
          <div className="vbiz-eyebrow mb-0 rounded-lg px-2.5 py-1 md:px-3 md:py-1.5">
            <Camera size={12} /> Image Vault
          </div>

          {isLoading ? (
            <>
              <div className="h-8 w-2/3 max-w-lg animate-pulse rounded-lg bg-zinc-200 md:h-10 dark:bg-zinc-700" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            </>
          ) : (
            <>
              <h2 className="vbiz-title max-w-2xl text-2xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-4xl">
                {sectionTitle}
              </h2>
              <p className="vbiz-description max-w-xl text-sm leading-snug font-medium md:text-base md:leading-normal">
                Browse curated gallery images from this profile.
              </p>
            </>
          )}
        </div>

        {showFilters && onTabChange && scrollRef ? (
          <div className="relative z-10 flex w-full shrink-0 md:w-auto">
            <div
              ref={scrollRef}
              className="vbiz-filter-bar no-scrollbar mask-edges inline-flex max-w-full cursor-grab items-center gap-1 overflow-x-auto rounded-xl border p-1 active:cursor-grabbing md:gap-1.5 md:rounded-2xl md:p-1.5"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onTabChange(category)}
                  className={`relative z-10 flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 md:rounded-xl md:px-4 md:py-2.5 ${
                    activeTab === category ? 'vbiz-filter-chip-active' : 'vbiz-filter-chip'
                  }`}
                >
                  <span className="relative z-10">{category}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
