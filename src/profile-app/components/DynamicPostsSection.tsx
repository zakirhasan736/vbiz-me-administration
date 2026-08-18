'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { formatGeneralPostDate } from '@/lib/vcardGeneralPosts'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { V3ErrorState, V3PreviewAwareText, V3SectionHeader } from '@/profile-app/sections'
import { ArrowUpRight, BookOpen, Calendar, FileEdit } from 'lucide-react'
import { motion } from 'motion/react'
import type { MouseEvent } from 'react'

const SKELETON_CARD_COUNT = 3

type DynamicPostsSectionProps = {
  sectionTitle: string
  posts: DynamicPostListItem[]
  isLoading: boolean
  isError: boolean
  emptyMessage: string
  badgeLabel?: string
  onPostClick?: (post: DynamicPostListItem) => void
}

export function DynamicPostsSection({
  sectionTitle,
  posts,
  isLoading,
  isError,
  emptyMessage,
  badgeLabel,
  onPostClick,
}: DynamicPostsSectionProps) {
  const badge = badgeLabel ?? sectionTitle
  const showInitialLoader = isLoading && posts.length === 0
  const showEmptyState = !isLoading && !isError && posts.length === 0

  if (showInitialLoader) {
    return (
      <div className="w-full pb-20">
        <SectionHeader badge={badge} sectionTitle={sectionTitle} isLoading />
        <div className="vbiz-bento-grid grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
            <PostCardSkeleton key={idx} delay={idx * 0.08} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full pb-20">
        <SectionHeader badge={badge} sectionTitle={sectionTitle} />
        <V3ErrorState sectionTitle={sectionTitle} />
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800/80">
            <FileEdit size={24} />
          </div>
          <h2 className="vbiz-title mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {sectionTitle}
          </h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            <V3PreviewAwareText published={emptyMessage} />
          </p>
        </div>
      </div>
    )
  }

  const [featured, ...rest] = posts

  return (
    <div className="w-full pb-20">
      <SectionHeader badge={badge} sectionTitle={sectionTitle} />

      {featured ? (
        <div className="vbiz-bento-grid mb-4 grid w-full grid-cols-1 items-start gap-4 md:grid-cols-3 lg:grid-cols-4">
          <FeaturedPostCard post={featured} onPostClick={onPostClick} />
          <div className="group relative flex min-h-75 flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-xl transition-all duration-500 hover:border-zinc-300 md:col-span-3 lg:col-span-1 lg:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-center text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100">
              <BookOpen size={24} className="text-[#eab308]" />
            </div>
            <h3 className="mb-2 text-center text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {posts.length} {posts.length === 1 ? 'Entry' : 'Entries'}
            </h3>
            <p className="max-w-50 text-center text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              {sectionTitle} from your vBiz profile.
            </p>
          </div>
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="vbiz-bento-grid grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, idx) => (
            <PostCard key={post.id} post={post} delay={idx * 0.08} onPostClick={onPostClick} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SectionHeader({ badge, sectionTitle }: { badge: string; sectionTitle: string; isLoading?: boolean }) {
  return (
    <V3SectionHeader
      badge={badge}
      badgeIcon={FileEdit}
      title={sectionTitle}
      subtitle="Articles and updates from your vBiz profile."
    />
  )
}

function PostCardSkeleton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <div className="mb-4 h-28 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-2 h-4 w-1/3 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-16 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
    </motion.div>
  )
}

function FeaturedPostCard({
  post,
  onPostClick,
}: {
  post: DynamicPostListItem
  onPostClick?: (post: DynamicPostListItem) => void
}) {
  const dateLabel = formatGeneralPostDate(post.date)
  const imageUrl = post.featuredImage.trim()
  const isClickable = Boolean(onPostClick)
  const description = stripHtml(post.description)

  const inner = (
    <>
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply grayscale transition-transform duration-1000 group-hover:scale-105 dark:opacity-40 dark:mix-blend-overlay"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555529733-0e67056058e1?q=80&w=1200&fit=crop')] bg-cover bg-center opacity-30 mix-blend-multiply grayscale transition-transform duration-1000 group-hover:scale-105 dark:opacity-40 dark:mix-blend-overlay" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-zinc-50 via-zinc-100/90 to-transparent dark:from-zinc-950 dark:via-zinc-900/80" />
      <div className="relative z-10 flex min-h-100 w-full flex-col justify-end p-8 lg:p-10">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase sm:text-xs dark:bg-zinc-100 dark:text-zinc-950">
            Latest
          </span>
          {dateLabel ? (
            <span className="flex items-center gap-2 text-xs font-medium text-zinc-600 sm:text-sm dark:text-zinc-400">
              <Calendar size={14} /> {dateLabel}
            </span>
          ) : null}
        </div>
        <h2 className="mb-6 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-black sm:text-4xl lg:text-4xl dark:text-zinc-100 dark:group-hover:text-white">
          {post.title}
        </h2>
        <TruncatedClampText
          plain={description}
          className="mb-8 max-w-xl"
          textClassName="text-base leading-normal font-medium text-zinc-600 lg:text-lg dark:text-zinc-400"
          minLength={150}
          onReadMore={
            onPostClick
              ? (e: MouseEvent) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onPostClick(post)
                }
              : undefined
          }
        />
        {isClickable ? (
          <div className="mt-auto flex w-full items-center justify-end border-t border-zinc-200 pt-6 md:max-w-xl dark:border-zinc-800/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 dark:bg-zinc-100 dark:text-zinc-950">
              <ArrowUpRight size={20} strokeWidth={2.5} />
            </div>
          </div>
        ) : null}
      </div>
    </>
  )

  const className =
    'group relative flex min-h-100 flex-col justify-end overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 md:col-span-3 lg:col-span-3 dark:border-zinc-800/80 dark:bg-zinc-900' +
    (isClickable ? ' cursor-pointer' : '')

  if (isClickable && onPostClick) {
    return (
      <button type="button" onClick={() => onPostClick(post)} className={`${className} text-left`}>
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}

function PostCard({
  post,
  delay,
  onPostClick,
}: {
  post: DynamicPostListItem
  delay: number
  onPostClick?: (post: DynamicPostListItem) => void
}) {
  const dateLabel = formatGeneralPostDate(post.date)
  const imageUrl = post.featuredImage.trim()
  const isClickable = Boolean(onPostClick)
  const description = stripHtml(post.description)

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
    >
      {imageUrl ? (
        <div className="mb-4 h-28 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={post.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800/80">
          <FileEdit size={18} />
        </div>
      )}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {dateLabel ? (
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">{dateLabel}</span>
        ) : null}
      </div>
      <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{post.title}</h3>
      <TruncatedClampText
        plain={description}
        className="mb-4"
        minLength={150}
        onReadMore={
          onPostClick
            ? (e: MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                onPostClick(post)
              }
            : undefined
        }
      />
    </motion.div>
  )

  if (isClickable && onPostClick) {
    return (
      <button type="button" onClick={() => onPostClick(post)} className="block w-full self-start text-left">
        {content}
      </button>
    )
  }

  return content
}
