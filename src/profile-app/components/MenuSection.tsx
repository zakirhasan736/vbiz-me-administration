'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { contentGridClass } from '@/profile-app/lib/contentGridClass'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { SectionBannerBody, V3ErrorState, V3PreviewAwareText } from '@/profile-app/sections'
import { useGetDynamicSectionQuery } from '@/redux/api'
import { cn } from '@/utils/cn'
import { ArrowLeft, ArrowUpRight, UtensilsCrossed, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

type MenuMedia = { url: string; kind: 'image' | 'video' }

function youtubeEmbedSrc(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function vimeoEmbedSrc(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function resolveMenuImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured

  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function collectMenuMedia(item: DynamicPostListItem): MenuMedia[] {
  const urls: string[] = []
  const push = (value: string) => {
    const url = value.trim()
    if (!url || urls.includes(url)) return
    const encoded = encodeMediaUrl(url) || url
    if (!isVideoUrl(url) && !isUsableImageSrc(encoded)) return
    urls.push(url)
  }
  push(item.featuredImage)
  for (const attachment of item.attachments) push(attachment.url || '')
  if (isVideoUrl(item.generalInfoUrl)) push(item.generalInfoUrl)
  return urls.map((url) => ({ url, kind: isVideoUrl(url) ? 'video' : 'image' }))
}

/** A real details link. Media files stay in the popup instead of navigating away. */
function menuPageLink(item: DynamicPostListItem, media: MenuMedia[]): string {
  const url = item.generalInfoUrl.trim()
  if (!url || isVideoUrl(url)) return ''
  if (media.some((entry) => entry.url === url)) return ''
  return url
}

function MenuCardSkeleton({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <div className="h-48 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-2/3 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </motion.div>
  )
}

type MenuCardProps = {
  item: DynamicPostListItem
  idx: number
  accent: string
  onSelect: (item: DynamicPostListItem) => void
  onPreview: (item: DynamicPostListItem) => void
}

function MenuCard({ item, idx, accent, onSelect, onPreview }: MenuCardProps) {
  const media = collectMenuMedia(item)
  const imageUrl = media.find((entry) => entry.kind === 'image')?.url || media[0]?.url || ''
  const video = media.find((entry) => entry.kind === 'video')
  const pageLink = menuPageLink(item, media)
  const preview = stripHtml(item.description)
  const hasDetail = Boolean(pageLink || preview || item.description.trim())
  const opensPreviewOnCard = Boolean(media.length) && (!pageLink || Boolean(video))

  const onCardActivate = () => {
    if (opensPreviewOnCard) onPreview(item)
    else if (hasDetail) onSelect(item)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
    >
      <button
        type="button"
        onClick={() => (media.length ? onPreview(item) : onCardActivate())}
        disabled={!media.length && !opensPreviewOnCard}
        className={`relative h-48 overflow-hidden bg-zinc-100 text-left dark:bg-zinc-950 ${media.length ? 'cursor-zoom-in' : 'cursor-default'}`}
        aria-label={media.length ? `View ${item.title || 'menu'} ${video ? 'video' : 'image'}` : undefined}
      >
        {imageUrl && !video ? (
          <Image
            width={640}
            height={360}
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : video ? (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950">
            {imageUrl && imageUrl !== video.url ? (
              <Image
                width={640}
                height={360}
                src={imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-70"
              />
            ) : null}
            <span className="relative rounded-full bg-black/60 px-4 py-2 text-xs font-bold tracking-wide text-white uppercase">
              Play video
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <UtensilsCrossed size={36} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

        <span
          className="pointer-events-none absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-zinc-900 uppercase"
          style={{ backgroundColor: accent }}
        >
          Menu
        </span>
      </button>

      <button
        type="button"
        onClick={onCardActivate}
        disabled={!opensPreviewOnCard && !hasDetail}
        className={`flex flex-1 flex-col p-5 text-left ${opensPreviewOnCard || hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {item.title.trim() ? (
          <h3 className="mb-2 text-lg leading-snug font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
            {item.title}
          </h3>
        ) : null}

        {preview ? (
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            {preview}
          </p>
        ) : null}

        {opensPreviewOnCard ? (
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold" style={{ color: accent }}>
            {video ? 'View video' : 'View menu'} <ArrowUpRight size={14} />
          </span>
        ) : hasDetail ? (
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold" style={{ color: accent }}>
            View item <ArrowUpRight size={14} />
          </span>
        ) : null}
      </button>
    </motion.article>
  )
}

function MenuMediaPopup({
  item,
  accent,
  onClose,
  onOpenDetails,
}: {
  item: DynamicPostListItem
  accent: string
  onClose: () => void
  onOpenDetails: (() => void) | null
}) {
  const isClient = useIsClient()
  const media = collectMenuMedia(item)
  const [index, setIndex] = useState(0)
  const current = media[index]
  const src = current ? encodeMediaUrl(current.url) || current.url : ''
  const youtube = current ? youtubeEmbedSrc(current.url) : null
  const vimeo = current ? vimeoEmbedSrc(current.url) : null

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (media.length < 2) return
      if (event.key === 'ArrowLeft') setIndex((value) => (value > 0 ? value - 1 : media.length - 1))
      if (event.key === 'ArrowRight') setIndex((value) => (value < media.length - 1 ? value + 1 : 0))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [media.length, onClose])

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
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-200 flex items-center justify-center bg-zinc-950/80 px-4 pt-[max(4.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title || 'Menu'} preview`}
    >
      <button
        type="button"
        aria-label="Close menu preview"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white hover:bg-black/75"
      >
        <X size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.28 }}
        className="flex max-h-[90dvh] w-full max-w-[min(960px,94vw)] flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {current.kind === 'video' && (youtube || vimeo) ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              src={youtube || vimeo || undefined}
              title={item.title || 'Menu video'}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : current.kind === 'video' ? (
          <video src={src} controls playsInline autoPlay className="max-h-[80dvh] w-full bg-black object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={item.title || 'Menu'} className="max-h-[80dvh] w-full object-contain" />
        )}
        <div className="flex items-center justify-between gap-3 bg-zinc-950 px-4 py-3 text-white">
          <p className="min-w-0 truncate text-sm font-bold">{item.title || 'Menu'}</p>
          <div className="flex shrink-0 items-center gap-2">
            {media.length > 1 ? (
              <span className="text-xs font-semibold text-white/70">
                {index + 1} / {media.length}
              </span>
            ) : null}
            {onOpenDetails ? (
              <button
                type="button"
                onClick={onOpenDetails}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-950"
                style={{ backgroundColor: accent }}
              >
                View details
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

type MenuItemDetailProps = {
  item: DynamicPostListItem
  sectionTitle: string
  accent: string
  onBack: () => void
  onPreview: (item: DynamicPostListItem) => void
}

function MenuItemDetail({ item, sectionTitle, accent, onBack, onPreview }: MenuItemDetailProps) {
  const heroImage = resolveMenuImage(item)
  const contentImages = item.attachments
    .map((attachment) => attachment.url.trim())
    .filter((url) => url && url !== heroImage)
  const detailUrl = item.generalInfoUrl.trim()
  const hasHtml = item.description.trim().length > 0

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

      <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50">
        {heroImage ? (
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="relative block aspect-21/9 w-full cursor-zoom-in overflow-hidden bg-zinc-100 text-left dark:bg-zinc-950"
            aria-label={`View ${item.title || 'menu'} image`}
          >
            <Image src={heroImage} alt={item.title} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
                <UtensilsCrossed size={12} style={{ color: accent }} /> Menu
              </div>
              {item.title.trim() ? (
                <h1 className="max-w-4xl text-2xl leading-[1.1] font-bold tracking-tight text-white sm:text-4xl lg:text-4xl">
                  {item.title}
                </h1>
              ) : null}
            </div>
          </button>
        ) : (
          <div className="border-b border-zinc-200 p-8 lg:p-10 dark:border-zinc-800/80">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
              <UtensilsCrossed size={12} style={{ color: accent }} /> Menu
            </div>
            {item.title.trim() ? (
              <h1 className="max-w-4xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
                {item.title}
              </h1>
            ) : null}
          </div>
        )}

        <div className="space-y-8 p-8 lg:p-10">
          {hasHtml ? (
            <div
              className="prose prose-zinc dark:prose-invert max-w-3xl text-base leading-relaxed font-medium text-zinc-700 lg:text-lg dark:text-zinc-300"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          ) : null}

          {contentImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {contentImages.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => onPreview(item)}
                  className="relative cursor-zoom-in overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 text-left dark:border-zinc-800/80 dark:bg-zinc-950"
                >
                  <Image src={url} alt={item.title} className="h-auto w-full object-cover" width={100} height={100} />
                </button>
              ))}
            </div>
          ) : null}

          {detailUrl ? (
            <a
              href={detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-zinc-900 transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              Learn more <ArrowUpRight size={16} />
            </a>
          ) : null}
        </div>
      </article>
    </motion.div>
  )
}

function MenuSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="mb-4 min-h-[220px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      <div className="relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MenuCardSkeleton idx={0} />
        <MenuCardSkeleton idx={1} />
        <MenuCardSkeleton idx={2} />
      </div>
    </div>
  )
}

export const MenuSection = () => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')
  const [selectedItemId, setSelectedItemId] = useState<number | string | null>(null)
  const [previewItemId, setPreviewItemId] = useState<number | string | null>(null)

  const { data, isLoading, isError } = useGetDynamicSectionQuery(
    { profileId, sectionName: PUBLIC_SECTION_NAMES.menu },
    { skip: !profileId }
  )

  const sectionTitle = useResolvedSectionTitle(data?.sectionTitle, 'Menu')
  const items = data?.posts ?? []
  const selectedItem = items.find((item) => item.id === selectedItemId)
  const previewItem = items.find((item) => item.id === previewItemId)
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  if (!profileId) return null

  const previewPopup = (
    <AnimatePresence>
      {previewItem ? (
        <MenuMediaPopup
          key={String(previewItem.id)}
          item={previewItem}
          accent={accent}
          onClose={() => setPreviewItemId(null)}
          onOpenDetails={
            menuPageLink(previewItem, collectMenuMedia(previewItem))
              ? () => {
                  setPreviewItemId(null)
                  setSelectedItemId(previewItem.id)
                }
              : null
          }
        />
      ) : null}
    </AnimatePresence>
  )

  if (selectedItem) {
    return (
      <>
        <MenuItemDetail
          item={selectedItem}
          sectionTitle={sectionTitle}
          accent={accent}
          onBack={() => setSelectedItemId(null)}
          onPreview={(menuItem) => setPreviewItemId(menuItem.id)}
        />
        {previewPopup}
      </>
    )
  }

  if (showInitialLoader) {
    return <MenuSkeleton />
  }

  if (isError) {
    return (
      <div className="w-full pb-20">
        <V3ErrorState sectionTitle={sectionTitle} />
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
            <UtensilsCrossed size={24} style={{ color: accent }} />
          </div>
          <h2 className="vbiz-title mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {sectionTitle}
          </h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            <V3PreviewAwareText published="No menu items have been published yet." />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="vbiz-section-banner group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border p-8 backdrop-blur-xl md:flex-row md:items-center lg:col-span-4 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />

          <div
            className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"
            style={{ backgroundColor: `${accent}18` }}
          />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <UtensilsCrossed size={12} style={{ color: accent }} /> Dining
            </div>

            <SectionBannerBody
              fallbackTitle={sectionTitle}
              fallbackDescription="Explore our offerings and discover what's available today."
              titleClassName="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100"
              descriptionClassName="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400"
            />
          </div>
        </div>
      </div>

      <div className={cn('relative z-20 mt-4', contentGridClass(items.length, 'md:grid-cols-2 lg:grid-cols-3'))}>
        {items.map((item, idx) => (
          <MenuCard
            key={item.id}
            item={item}
            idx={idx}
            accent={accent}
            onSelect={(menuItem) => setSelectedItemId(menuItem.id)}
            onPreview={(menuItem) => setPreviewItemId(menuItem.id)}
          />
        ))}
      </div>
      {previewPopup}
    </div>
  )
}
