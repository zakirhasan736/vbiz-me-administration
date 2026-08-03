'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetDinnerQuery } from '@/redux/api'
import { ArrowLeft, ArrowUpRight, Utensils } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

function resolveDinnerImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured

  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function DinnerCardSkeleton({ idx }: { idx: number }) {
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

type DinnerCardProps = {
  item: DynamicPostListItem
  idx: number
  accent: string
  onSelect: (item: DynamicPostListItem) => void
}

function DinnerCard({ item, idx, accent, onSelect }: DinnerCardProps) {
  const imageUrl = resolveDinnerImage(item)
  const preview = stripHtml(item.description)
  const hasDetail = Boolean(preview || item.description.trim())

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      onClick={() => onSelect(item)}
      disabled={!hasDetail}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700 ${hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {imageUrl ? (
          <Image
            width={640}
            height={360}
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <Utensils size={36} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

        <span
          className="absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-zinc-900 uppercase"
          style={{ backgroundColor: accent }}
        >
          Dinner
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-lg leading-snug font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
          {item.title}
        </h3>

        {preview ? (
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            {preview}
          </p>
        ) : null}

        {hasDetail ? (
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold" style={{ color: accent }}>
            View item <ArrowUpRight size={14} />
          </span>
        ) : null}
      </div>
    </motion.button>
  )
}

type DinnerItemDetailProps = {
  item: DynamicPostListItem
  sectionTitle: string
  accent: string
  onBack: () => void
}

function DinnerItemDetail({ item, sectionTitle, accent, onBack }: DinnerItemDetailProps) {
  const heroImage = resolveDinnerImage(item)
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
          <div className="relative aspect-21/9 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
            <Image src={heroImage} alt={item.title} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
                <Utensils size={12} style={{ color: accent }} /> Dinner
              </div>
              <h1 className="max-w-4xl text-2xl leading-[1.1] font-bold tracking-tight text-white sm:text-4xl lg:text-4xl">
                {item.title}
              </h1>
            </div>
          </div>
        ) : (
          <div className="border-b border-zinc-200 p-8 lg:p-10 dark:border-zinc-800/80">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Utensils size={12} style={{ color: accent }} /> Dinner
            </div>
            <h1 className="max-w-4xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {item.title}
            </h1>
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
                <div
                  key={url}
                  className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-950"
                >
                  <Image src={url} alt={item.title} className="h-auto w-full object-cover" width={100} height={100} />
                </div>
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

function DinnerSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="mb-4 min-h-[220px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      <div className="relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DinnerCardSkeleton idx={0} />
        <DinnerCardSkeleton idx={1} />
        <DinnerCardSkeleton idx={2} />
      </div>
    </div>
  )
}

export const DinnerSection = () => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const { data, isLoading, isError } = useGetDinnerQuery(profileId, { skip: !profileId })

  const sectionTitle = data?.sectionTitle ?? 'Dinner'
  const items = data?.posts ?? []
  const selectedItem = items.find((item) => item.id === selectedItemId)
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  if (!profileId) return null

  if (selectedItem) {
    return (
      <DinnerItemDetail
        item={selectedItem}
        sectionTitle={sectionTitle}
        accent={accent}
        onBack={() => setSelectedItemId(null)}
      />
    )
  }

  if (showInitialLoader) {
    return <DinnerSkeleton />
  }

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
            <Utensils size={24} style={{ color: accent }} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No dinner items have been published yet. Add content from the vCard editor Dinner tab.
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
              <Utensils size={12} style={{ color: accent }} /> Evening
            </div>

            <h2 className="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {sectionTitle.includes(' ') ? (
                <>
                  {sectionTitle.slice(0, sectionTitle.lastIndexOf(' '))}{' '}
                  <span className="font-medium italic" style={{ color: accent }}>
                    {sectionTitle.slice(sectionTitle.lastIndexOf(' ') + 1)}
                  </span>
                </>
              ) : (
                sectionTitle
              )}
            </h2>
            <p className="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400">
              Explore our dinner offerings for the evening.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <DinnerCard
            key={item.id}
            item={item}
            idx={idx}
            accent={accent}
            onSelect={(dinnerItem) => setSelectedItemId(dinnerItem.id)}
          />
        ))}
      </div>
    </div>
  )
}
