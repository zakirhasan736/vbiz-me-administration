'use client'

import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import {
  getContentMediaVideoDisplayTitle,
  hasContentMediaContent,
  isPersistableMediaUrl,
} from '@/lib/vcardContentMedia'
import { contentGridClass } from '@/profile-app/lib/contentGridClass'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { V3EmptyState, V3SectionHeader, V3SectionShell } from '@/profile-app/sections'
import type { VCardContentMediaGalleryItem, VCardContentMediaVideoItem } from '@/types/vcard'
import { ArrowUpRight, Images, PlayCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

type ContentMediaSectionProps = {
  sectionName?: string
}

function youtubeEmbedSrc(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function GalleryLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: Array<{ src: string; alt: string }>
  initialIndex: number
  onClose: () => void
}) {
  const isClient = useIsClient()
  const [index, setIndex] = useState(initialIndex)
  const current = images[index]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
      if (event.key === 'ArrowRight') setIndex((i) => (i < images.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [images.length, onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!isClient || !current) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 px-4 pt-16 pb-28 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery preview"
    >
      <button
        type="button"
        aria-label="Close gallery"
        onClick={onClose}
        className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white"
      >
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.src}
        alt={current.alt}
        className="max-h-[80vh] max-w-full rounded-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>,
    document.body
  )
}

function GalleryGrid({
  items,
  onOpen,
}: {
  items: Array<{ item: VCardContentMediaGalleryItem; src: string }>
  onOpen: (index: number) => void
}) {
  return (
    <div className={contentGridClass(items.length, 'sm:grid-cols-2 lg:grid-cols-3')}>
      {items.map(({ item, src }, index) => (
        <button
          key={item.id || src}
          type="button"
          onClick={() => onOpen(index)}
          className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/60 shadow-sm backdrop-blur-xl transition hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={item.name || 'Gallery image'} className="aspect-4/3 w-full object-cover" />
          <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
        </button>
      ))}
    </div>
  )
}

function VideoCard({ item }: { item: VCardContentMediaVideoItem }) {
  const href = encodeMediaUrl(item.url.trim()) || item.url.trim()
  const youtube = youtubeEmbedSrc(item.url)
  const displayTitle = getContentMediaVideoDisplayTitle(item.title)
  const a11yTitle = displayTitle || 'Video'

  if (youtube) {
    return (
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/60 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="aspect-video w-full overflow-hidden bg-black">
          <iframe
            src={youtube}
            title={a11yTitle}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {displayTitle ? (
          <p className="truncate px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">{displayTitle}</p>
        ) : null}
      </div>
    )
  }

  if (isVideoUrl(item.url) || isVideoUrl(href)) {
    return (
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/60 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="aspect-video w-full overflow-hidden bg-black">
          <video
            src={href}
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
            aria-label={a11yTitle}
          />
        </div>
        {displayTitle ? (
          <p className="truncate px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">{displayTitle}</p>
        ) : null}
      </div>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-[#eab308] dark:bg-zinc-800">
        <PlayCircle size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {displayTitle || 'Video'}
        </span>
        <span className="mt-0.5 block truncate text-xs font-medium text-zinc-500">Open video</span>
      </span>
      <ArrowUpRight size={18} className="shrink-0 text-zinc-400" />
    </a>
  )
}

/** Content & media tab — gallery images, videos, and note from the vCard editor. */
export function ContentMediaSection({ sectionName = 'Content & media' }: ContentMediaSectionProps) {
  const { contentMedia } = useProfileDisplay()
  const sectionTitle = useResolvedSectionTitle(undefined, sectionName.trim() || 'Content & media')
  const note = contentMedia.note?.trim() || ''
  const gallery = contentMedia.gallery
    .filter((item) => isPersistableMediaUrl(item.url) && isUsableImageSrc(encodeMediaUrl(item.url) || item.url))
    .map((item) => ({
      item,
      src: encodeMediaUrl(item.url.trim()) || item.url.trim(),
    }))
  const videos = contentMedia.videos.filter((item) => isPersistableMediaUrl(item.url))
  const hasContent = hasContentMediaContent(contentMedia)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!hasContent) {
    return (
      <V3EmptyState
        icon={Images}
        title={sectionTitle}
        message="No published content is available for this section yet."
      />
    )
  }

  return (
    <V3SectionShell>
      <div className="flex w-full flex-col gap-4 md:gap-6">
        <V3SectionHeader
          badge={sectionTitle}
          badgeIcon={Images}
          title={sectionTitle}
          subtitle="Gallery images and videos from your vBiz card."
        />

        {note ? (
          <div className="vbiz-card rounded-3xl border border-zinc-200 bg-white/60 p-6 shadow-sm backdrop-blur-xl md:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap text-zinc-700 md:text-base dark:text-zinc-300">
              {note}
            </p>
          </div>
        ) : null}

        {gallery.length ? (
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              {gallery.length === 1 ? 'Image' : 'Images'}
            </p>
            <GalleryGrid items={gallery} onOpen={setLightboxIndex} />
          </div>
        ) : null}

        {videos.length ? (
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              {videos.length === 1 ? 'Video' : 'Videos'}
            </p>
            <div className={contentGridClass(videos.length, 'lg:grid-cols-2')}>
              {videos.map((item) => (
                <VideoCard key={item.id || item.url} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {lightboxIndex != null ? (
          <GalleryLightbox
            images={gallery.map(({ item, src }) => ({ src, alt: item.name || 'Gallery image' }))}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        ) : null}
      </AnimatePresence>
    </V3SectionShell>
  )
}
