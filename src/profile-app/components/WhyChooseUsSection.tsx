'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { PublicTabFrame, V3ErrorState, V3PreviewAwareText } from '@/profile-app/sections'
import { useGetDynamicSectionQuery } from '@/redux/api'
import { ArrowUpRight, Landmark, Quote } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import type { ReactNode } from 'react'

function resolveWhyChooseUsImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured
  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function WhyChooseUsSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="min-h-[240px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
    </div>
  )
}

function WhyChooseUsCard({
  item,
  sectionTitle,
  accent,
  idx,
}: {
  item: DynamicPostListItem
  sectionTitle: string
  accent: string
  idx: number
}) {
  const imageUrl = resolveWhyChooseUsImage(item)
  const plainDescription = stripHtml(item.description)
  const detailUrl = item.generalInfoUrl.trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
      className="vbiz-content-card group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-5 md:p-6 lg:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <div className="relative z-10">
        {imageUrl ? (
          <div className="mb-8 flex justify-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-4xl border border-zinc-200 bg-white shadow-xl transition-all duration-500 group-hover:-translate-y-2 lg:h-56 lg:w-56 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-2xl">
              <Image src={imageUrl} alt={item.title} width={256} height={256} className="h-full w-full object-cover" />
            </div>
          </div>
        ) : null}

        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
          <Landmark size={12} style={{ color: accent }} /> {sectionTitle.trim()}
        </div>

        <div className="relative">
          <Quote size={40} className="absolute -top-4 -left-4 -rotate-12 text-zinc-300 dark:text-zinc-800/50" />
          {item.title.trim() ? (
            <h2 className="vbiz-title relative z-10 mb-2 max-w-3xl pl-2 text-2xl leading-[1.1] font-bold tracking-tight sm:text-4xl lg:text-4xl">
              {item.title}
            </h2>
          ) : null}
        </div>

        <div className="relative z-10 mt-4 lg:mt-8">
          <TruncatedClampText
            html={item.description}
            plain={plainDescription}
            accentColor={accent}
            textClassName="vbiz-description text-base leading-normal font-medium lg:text-lg"
          />

          {detailUrl ? (
            <a
              href={detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vbiz-on-light-surface inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-zinc-900 transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              Learn more <ArrowUpRight size={16} />
            </a>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

export const WhyChooseUsSection = () => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')

  const { data, isLoading, isError } = useGetDynamicSectionQuery(
    { profileId, sectionName: PUBLIC_SECTION_NAMES.whyChooseUs },
    { skip: !profileId }
  )
  const sectionTitle = useResolvedSectionTitle(data?.sectionTitle, 'Why Choose Us')
  const items = data?.posts ?? []
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  const frame = (children: ReactNode) => (
    <PublicTabFrame
      title={sectionTitle}
      badgeIcon={Landmark}
      fallbackDescription="Reasons clients and partners choose to work with us."
    >
      {children}
    </PublicTabFrame>
  )

  if (!profileId) return null
  if (showInitialLoader) return frame(<WhyChooseUsSkeleton />)

  if (isError) {
    return frame(<V3ErrorState sectionTitle={sectionTitle} />)
  }

  if (showEmptyState) {
    return frame(
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
          <Landmark size={24} style={{ color: accent }} />
        </div>
        <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
          <V3PreviewAwareText published="No why choose us content has been published yet." />
        </p>
      </div>
    )
  }

  return frame(
    <div className="flex w-full flex-col gap-4">
      {items.map((item, idx) => (
        <WhyChooseUsCard key={item.id} item={item} sectionTitle={sectionTitle} accent={accent} idx={idx} />
      ))}
    </div>
  )
}
