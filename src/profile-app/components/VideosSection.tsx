'use client'

import type { VideoListItem } from '@/interfaces/api/videos.interface'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetVideosQuery } from '@/redux/api'
import { CalendarDays, ChevronLeft, ChevronRight, Film, Image as ImageIcon, PlayCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

type GalleryPreview = {
  title: string
  images: string[]
  initialIndex: number
}

function GalleryLightbox({ preview, onClose }: { preview: GalleryPreview; onClose: () => void }) {
  const isClient = useIsClient()
  const [index, setIndex] = useState(preview.initialIndex)
  const total = preview.images.length
  const hasMultiple = total > 1
  const currentImage = preview.images[index] ?? ''

  const goPrev = useCallback(() => {
    setIndex((current) => (current > 0 ? current - 1 : total - 1))
  }, [total])

  const goNext = useCallback(() => {
    setIndex((current) => (current < total - 1 ? current + 1 : 0))
  }, [total])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!isClient || !currentImage) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 px-4 pt-16 pb-28 backdrop-blur-sm sm:px-6 sm:pt-20 sm:pb-32"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${preview.title} gallery preview`}
    >
      <button
        type="button"
        aria-label="Close gallery"
        onClick={onClose}
        className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70 sm:top-6 sm:right-6"
      >
        <X size={20} />
      </button>

      {hasMultiple ? (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation()
            goPrev()
          }}
          className="absolute top-1/2 left-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70 sm:left-6 sm:h-12 sm:w-12"
        >
          <ChevronLeft size={22} />
        </button>
      ) : null}

      <motion.div
        key={currentImage}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative flex max-h-[calc(100dvh-9rem)] max-w-[min(900px,90vw)] flex-col overflow-hidden rounded-lg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={`${preview.title} image ${index + 1}`}
          className="max-h-[calc(100dvh-11rem)] w-full object-contain"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-linear-to-t from-black/70 to-transparent px-5 py-4">
          <p className="text-base font-bold text-white">{preview.title}</p>
          {hasMultiple ? (
            <p className="shrink-0 text-sm font-semibold text-white/80">
              {index + 1} / {total}
            </p>
          ) : null}
        </div>
      </motion.div>

      {hasMultiple ? (
        <button
          type="button"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation()
            goNext()
          }}
          className="absolute top-1/2 right-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70 sm:right-6 sm:h-12 sm:w-12"
        >
          <ChevronRight size={22} />
        </button>
      ) : null}
    </motion.div>,
    document.body
  )
}

function VideosSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="mb-4 min-h-[220px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-[320px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

function VideoCard({
  item,
  idx,
  accent,
  onOpenGallery,
}: {
  item: VideoListItem
  idx: number
  accent: string
  onOpenGallery: (item: VideoListItem) => void
}) {
  const date = formatDate(item.createdAt)
  const isGallery = item.type === 'gallery'
  const hasGalleryImages = item.galleryImages.length > 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 ${hasGalleryImages ? 'cursor-pointer' : ''}`}
      onClick={hasGalleryImages ? () => onOpenGallery(item) : undefined}
      onKeyDown={
        hasGalleryImages
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenGallery(item)
              }
            }
          : undefined
      }
      role={hasGalleryImages ? 'button' : undefined}
      tabIndex={hasGalleryImages ? 0 : undefined}
    >
      <div className="relative h-56 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {item.featuredImage ? (
          <Image
            src={item.featuredImage}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            {isGallery ? (
              <ImageIcon size={40} className="text-zinc-400 dark:text-zinc-500" />
            ) : (
              <Film size={40} className="text-zinc-400 dark:text-zinc-500" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-zinc-900 uppercase"
          style={{ backgroundColor: accent }}
        >
          {isGallery ? <ImageIcon size={12} /> : <PlayCircle size={12} />} {isGallery ? 'Gallery' : 'Video'}
        </span>
        {hasGalleryImages ? (
          <span className="absolute right-3 bottom-3 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
            View gallery
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-3 line-clamp-2 text-xl leading-tight font-bold text-zinc-900 dark:text-zinc-100">
          {item.title}
        </h3>
        <div className="mt-auto flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} />
            {date || 'Unknown date'}
          </span>
          {isGallery ? <span>{item.galleryCount} images</span> : null}
        </div>
      </div>
    </motion.article>
  )
}

export function VideosSection() {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')
  const { data, isLoading, isError } = useGetVideosQuery(profileId, { skip: !profileId })
  const [galleryPreview, setGalleryPreview] = useState<GalleryPreview | null>(null)

  const sectionTitle = data?.sectionTitle ?? 'Video'
  const items = data?.items ?? []
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  const openGallery = useCallback((item: VideoListItem) => {
    if (item.galleryImages.length === 0) return
    setGalleryPreview({
      title: item.title,
      images: item.galleryImages,
      initialIndex: 0,
    })
  }, [])

  if (!profileId) return null
  if (showInitialLoader) return <VideosSkeleton />

  if (isError) {
    return (
      <div className="w-full pb-20">
        <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load {sectionTitle.toLowerCase()} right now. Please try again later.
        </div>
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
            <Film size={24} style={{ color: accent }} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No video portfolio items have been published yet. Add content from the vCard editor portfolio section.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-center md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
          <div
            className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"
            style={{ backgroundColor: `${accent}18` }}
          />
          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Film size={12} style={{ color: accent }} /> Portfolio
            </div>
            <h2 className="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {sectionTitle}
            </h2>
            <p className="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400">
              Browse published video and gallery portfolio items from your profile.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <VideoCard key={item.id} item={item} idx={idx} accent={accent} onOpenGallery={openGallery} />
        ))}
      </div>

      <AnimatePresence>
        {galleryPreview ? <GalleryLightbox preview={galleryPreview} onClose={() => setGalleryPreview(null)} /> : null}
      </AnimatePresence>
    </div>
  )
}
