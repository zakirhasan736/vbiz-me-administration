'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useSectionAccent, V3EmptyState, V3ErrorState, V3LoadingSkeleton, V3SectionShell } from '@/profile-app/sections'
import { useGetMissionStatementQuery } from '@/redux/api'
import { ArrowUpRight, BookOpen, Quote } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

function resolveMissionImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured

  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

type MissionContentCardProps = {
  item: DynamicPostListItem
  sectionTitle: string
  accent: string
  idx?: number
}

function MissionContentCard({ item, sectionTitle, accent, idx = 0 }: MissionContentCardProps) {
  const heroImage = resolveMissionImage(item)
  const hasHtml = item.description.trim().length > 0
  const plainDescription = stripHtml(item.description)
  const detailUrl = item.generalInfoUrl.trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
      className="group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 lg:p-8 dark:border-zinc-800/80 dark:bg-zinc-900"
    >
      <div className="absolute inset-0 h-full w-full bg-zinc-100 dark:bg-zinc-950">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-zinc-100 via-zinc-100/90 to-zinc-100/60 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-900/60" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-100/80 to-transparent dark:from-zinc-950/80" />
      </div>

      <div
        className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"
        style={{ backgroundColor: `${accent}18` }}
      />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

      <div className="relative z-10">
        {heroImage && (
          <div className="mb-6 flex justify-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-4xl border border-zinc-200 bg-white shadow-xl transition-all duration-500 group-hover:-translate-y-2 lg:h-56 lg:w-56 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-2xl">
              <Image src={heroImage} alt={item.title} width={256} height={256} className="object-cover" />
            </div>
          </div>
        )}

        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
          <BookOpen size={12} style={{ color: accent }} /> {sectionTitle.trim()}
        </div>

        <div className="relative">
          <Quote size={40} className="absolute -top-4 -left-4 -rotate-12 text-zinc-300 dark:text-zinc-800/50" />
          <h2 className="relative z-10 mb-2 max-w-3xl pl-2 text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
            {item.title}
          </h2>
        </div>

        <div className="relative z-10 mt-3 lg:mt-8">
          <TruncatedClampText
            html={hasHtml ? item.description : undefined}
            plain={!hasHtml ? plainDescription : undefined}
            maxLines={5}
            minLength={180}
            accentColor={accent}
            readMoreLabel="Read more"
            readLessLabel="Read less"
            textClassName="text-base leading-normal font-medium text-zinc-600 lg:text-lg dark:text-zinc-400"
          />

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
      </div>
    </motion.div>
  )
}

export const MissionSection = () => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const accent = useSectionAccent()

  const { data, isLoading, isError } = useGetMissionStatementQuery(profileId, { skip: !profileId })

  const sectionTitle = data?.sectionTitle ?? 'Mission Statement'
  const items = data?.posts ?? []
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  if (!profileId) return null

  if (showInitialLoader) {
    return <V3LoadingSkeleton />
  }

  if (isError) {
    return <V3ErrorState sectionTitle={sectionTitle} />
  }

  if (showEmptyState) {
    return (
      <V3EmptyState
        icon={BookOpen}
        title={sectionTitle}
        message="No mission statement has been published yet. Add content from the vCard editor Mission Statement tab."
      />
    )
  }

  return (
    <V3SectionShell>
      <div className="flex w-full flex-col gap-4 md:gap-6">
        {items.map((item, idx) => (
          <MissionContentCard key={item.id} item={item} sectionTitle={sectionTitle} accent={accent} idx={idx} />
        ))}
      </div>
    </V3SectionShell>
  )
}
