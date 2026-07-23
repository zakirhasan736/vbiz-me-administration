'use client'

import { formatGeneralPostDate, getPublishedGeneralPosts } from '@/lib/vcardGeneralPosts'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import type { VCardGeneralPost } from '@/types/vcard'
import { ArrowUpRight, BookOpen, Calendar, FileEdit } from 'lucide-react'
import { motion } from 'motion/react'

export const GeneralPostsSection = () => {
  const { generalPosts, isVisible } = useProfileDisplay()
  const entries = getPublishedGeneralPosts(generalPosts)

  if (!isVisible('Blog')) {
    return null
  }

  if (entries.length === 0) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800/80">
            <FileEdit size={24} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Blog</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            Add posts from the vCard editor → Blog tab. Published posts with a title or description appear here on v1
            and v2 profiles.
          </p>
        </div>
      </div>
    )
  }

  const [featured, ...rest] = entries

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <FileEdit size={12} className="text-[#eab308]" /> Blog
            </div>
            <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              News & <span className="font-medium text-[#eab308] italic">Updates</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 lg:text-lg dark:text-zinc-400">
              Articles and announcements from your vCard back office.
            </p>
          </div>
        </div>
      </div>

      {featured ? (
        <div className="vbiz-bento-grid mb-4 grid w-full grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <FeaturedPostCard post={featured} />
          <div className="group relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-xl transition-all duration-500 hover:border-zinc-300 md:col-span-3 lg:col-span-1 lg:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-center text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100">
              <BookOpen size={24} className="text-[#eab308]" />
            </div>
            <h3 className="mb-2 text-center text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {entries.length} {entries.length === 1 ? 'Update' : 'Updates'}
            </h3>
            <p className="max-w-[200px] text-center text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              News and announcements from your vCard back office.
            </p>
          </div>
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="vbiz-bento-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, idx) => (
            <PostCard key={post.id} post={post} delay={idx * 0.08} compact />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FeaturedPostCard({ post }: { post: VCardGeneralPost }) {
  const dateLabel = formatGeneralPostDate(post.date)
  const href = post.customUrl.trim() || undefined
  const imageUrl = post.featuredImage.trim()

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
      <div className="relative z-10 flex min-h-[400px] w-full flex-col justify-end p-8 lg:p-10">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {post.category.trim() ? (
            <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase sm:text-xs dark:bg-zinc-100 dark:text-zinc-950">
              {post.category}
            </span>
          ) : (
            <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase sm:text-xs dark:bg-zinc-100 dark:text-zinc-950">
              Latest
            </span>
          )}
          {dateLabel ? (
            <span className="flex items-center gap-2 text-xs font-medium text-zinc-600 sm:text-sm dark:text-zinc-400">
              <Calendar size={14} /> {dateLabel}
            </span>
          ) : null}
        </div>
        <h2 className="mb-6 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-black sm:text-4xl lg:text-5xl dark:text-zinc-100 dark:group-hover:text-white">
          {post.title.trim() || 'Update'}
        </h2>
        {post.description.trim() ? (
          <p className="mb-8 max-w-xl text-base leading-relaxed font-medium text-zinc-600 lg:text-lg dark:text-zinc-400">
            {post.description}
          </p>
        ) : null}
        {href ? (
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
    'group relative flex min-h-[400px] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 md:col-span-3 lg:col-span-3 dark:border-zinc-800/80 dark:bg-zinc-900'

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    )
  }

  return <div className={className}>{inner}</div>
}

function PostCard({
  post,
  delay,
  compact,
}: {
  post: ReturnType<typeof getPublishedGeneralPosts>[number]
  delay: number
  compact?: boolean
}) {
  const dateLabel = formatGeneralPostDate(post.date)
  const href = post.customUrl.trim() || undefined
  const imageUrl = post.featuredImage.trim()

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 ${compact ? 'min-h-[200px]' : 'min-h-[260px]'}`}
    >
      {imageUrl ? (
        <div className="mb-4 h-28 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={post.title || 'Post'} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800/80">
          <FileEdit size={18} />
        </div>
      )}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {post.category.trim() ? (
          <span className="rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
            {post.category}
          </span>
        ) : null}
        {dateLabel ? (
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">{dateLabel}</span>
        ) : null}
      </div>
      <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{post.title.trim() || 'Post'}</h3>
      {post.description.trim() ? (
        <p className="mb-4 line-clamp-4 flex-1 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
          {post.description}
        </p>
      ) : null}
      {href ? (
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-[#eab308]">
          Read more <ArrowUpRight size={14} />
        </span>
      ) : null}
    </motion.div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    )
  }

  return content
}
