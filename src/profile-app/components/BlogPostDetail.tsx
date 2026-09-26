'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { formatGeneralPostDate } from '@/lib/vcardGeneralPosts'
import { ArrowLeft, Calendar, FileEdit } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

type BlogPostDetailProps = {
  post: DynamicPostListItem
  sectionTitle: string
  onBack: () => void
}

export function BlogPostDetail({ post, sectionTitle, onBack }: BlogPostDetailProps) {
  const dateLabel = formatGeneralPostDate(post.date)
  const heroImage = post.featuredImage.trim() || post.attachments[0]?.url?.trim() || ''
  const contentImages = post.attachments
    .map((attachment) => attachment.url.trim())
    .filter((url) => url && url !== heroImage)

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
          <div className="vcard-blog-hero-media flex w-full items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-950">
            <Image
              src={heroImage}
              alt={post.title.trim() || ''}
              width={1600}
              height={900}
              className="h-auto max-h-[280px] w-full object-contain object-center sm:max-h-[380px] md:max-h-[440px]"
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
          </div>
        ) : null}

        <div className="border-b border-zinc-200 p-8 lg:p-10 dark:border-zinc-800/80">
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
            <FileEdit size={12} className="text-[#eab308]" /> Blog
          </div>
          {post.title.trim() ? (
            <h1 className="max-w-4xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {post.title}
            </h1>
          ) : null}
          {dateLabel ? (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Calendar size={14} /> {dateLabel}
            </p>
          ) : null}
        </div>

        <div className="space-y-8 p-8 lg:p-10">
          {post.description ? (
            /<\/?[a-z][\s\S]*>/i.test(post.description) ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-3xl text-base leading-relaxed font-medium text-zinc-700 lg:text-lg dark:text-zinc-300"
                dangerouslySetInnerHTML={{ __html: post.description }}
              />
            ) : (
              <p className="max-w-3xl text-base leading-relaxed font-medium whitespace-pre-wrap text-zinc-700 lg:text-lg dark:text-zinc-300">
                {post.description}
              </p>
            )
          ) : null}

          {contentImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {contentImages.map((url) => (
                <div
                  key={url}
                  className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={post.title} className="h-auto w-full object-contain" />
                </div>
              ))}
            </div>
          ) : null}

          {!post.description && !heroImage && post.attachments.length === 0 ? (
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No additional content for this post.</p>
          ) : null}
        </div>
      </article>
    </motion.div>
  )
}
