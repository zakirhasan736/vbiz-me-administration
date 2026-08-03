'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetHomeSolarQuery } from '@/redux/api'
import { ArrowUpRight, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

function resolveHomeSolarImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured
  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function HomeSolarSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="mb-4 min-h-[220px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-[320px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

function HomeSolarCard({ item, idx, accent }: { item: DynamicPostListItem; idx: number; accent: string }) {
  const imageUrl = resolveHomeSolarImage(item)
  const preview = stripHtml(item.description)
  const detailUrl = item.generalInfoUrl.trim()

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
    >
      <div className="relative h-56 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <Sun size={40} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-zinc-900 uppercase"
          style={{ backgroundColor: accent }}
        >
          <Sun size={12} /> Solar
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-3 text-xl leading-tight font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
        {item.description.trim() ? (
          <div
            className="prose prose-zinc dark:prose-invert line-clamp-4 max-w-none text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        ) : preview ? (
          <p className="line-clamp-4 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">{preview}</p>
        ) : null}

        {detailUrl ? (
          <a
            href={detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ color: accent }}
          >
            Learn more <ArrowUpRight size={15} />
          </a>
        ) : null}
      </div>
    </motion.article>
  )
}

export const HomeSolarSection = () => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')

  const { data, isLoading, isError } = useGetHomeSolarQuery(profileId, { skip: !profileId })

  const sectionTitle = data?.sectionTitle ?? 'Home Solar'
  const items = data?.posts ?? []
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  if (!profileId) return null
  if (showInitialLoader) return <HomeSolarSkeleton />

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
            <Sun size={24} style={{ color: accent }} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No home solar content has been published yet. Add content from the vCard editor Home Solar tab.
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
              <Sun size={12} style={{ color: accent }} /> Solar
            </div>
            <h2 className="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {sectionTitle}
            </h2>
            <p className="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400">
              Explore home solar offerings, partnerships, and featured solutions from this profile.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <HomeSolarCard key={item.id} item={item} idx={idx} accent={accent} />
        ))}
      </div>
    </div>
  )
}
