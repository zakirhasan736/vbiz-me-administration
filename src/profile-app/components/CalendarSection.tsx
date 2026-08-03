'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { resolveCalendarItemUrl, stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetCalendarQuery } from '@/redux/api'
import { ArrowUpRight, Calendar, Clock, Video } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

const SKELETON_CARD_COUNT = 3

function CalendarCardSkeleton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex min-h-[260px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <div className="mb-6 h-12 w-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="mb-8 h-16 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-auto h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
    </motion.div>
  )
}

function CalendarItemCard({ item, idx }: { item: DynamicPostListItem; idx: number }) {
  const actionUrl = resolveCalendarItemUrl(item)
  const description = stripHtml(item.description)
  const imageUrl = item.featuredImage.trim() || item.attachments[0]?.url?.trim() || ''

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.1 }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-4 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80${actionUrl ? 'cursor-pointer' : ''}`}
    >
      <div className="pointer-events-none absolute top-0 right-0 -mt-8 -mr-8 rounded-full bg-black/5 p-16 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-white/5" />

      {imageUrl ? (
        <div className="mb-6 h-52 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          <Image width={300} height={400} src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <Video className="text-yellow-primary" size={24} />
        </div>
      )}

      <h3 className="mb-2 text-xl leading-tight font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
        {item.title}
      </h3>
      {description && (
        <p className="mb-8 line-clamp-4 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Clock size={14} className="text-zinc-500" />
          Scheduling
        </div>

        {actionUrl ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
            <ArrowUpRight
              size={16}
              className="text-zinc-500 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-950"
            />
          </span>
        ) : null}
      </div>
    </motion.div>
  )

  if (!actionUrl) return card

  return (
    <a href={actionUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
      {card}
    </a>
  )
}

export const CalendarSection = () => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''

  const { data, isLoading, isError } = useGetCalendarQuery(profileId, { skip: !profileId })

  const items = data?.posts ?? []
  const sectionTitle = data?.sectionTitle ?? 'Calendar'
  const primaryItem = items[0]
  const primaryActionUrl = primaryItem ? resolveCalendarItemUrl(primaryItem) : ''
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  if (!profileId) return null

  if (showInitialLoader) {
    return (
      <div className="w-full pb-20">
        <SectionHeader sectionTitle={sectionTitle} isLoading />
        <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
            <CalendarCardSkeleton key={idx} delay={idx * 0.1} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full pb-20">
        <SectionHeader sectionTitle={sectionTitle} />
        <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load calendar right now. Please try again later.
        </div>
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="text-yellow-primary mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
            <Calendar size={24} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No calendar options have been published yet. Add content from the vCard editor Calendar tab.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <SectionHeader
        sectionTitle={sectionTitle}
        primaryLabel={primaryItem?.title}
        primaryActionUrl={primaryActionUrl}
      />

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, idx) => (
          <CalendarItemCard key={item.id} item={item} idx={idx} />
        ))}
      </div>
    </div>
  )
}

function SectionHeader({
  sectionTitle,
  isLoading,
}: {
  sectionTitle: string
  primaryLabel?: string
  primaryActionUrl?: string
  isLoading?: boolean
}) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-center md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

        <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

        <div className="relative z-10 w-full md:w-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
            <Calendar size={12} className="text-yellow-primary" /> Scheduling
          </div>

          {isLoading ? (
            <>
              <div className="mb-4 h-10 w-2/3 max-w-lg animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-5 w-full max-w-xl animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            </>
          ) : (
            <>
              <h2 className="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
                {sectionTitle}
              </h2>
              <p className="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400">
                {`Find a time that works for you. Let's connect and discuss how I can help you achieve your goals.`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
