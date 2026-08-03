'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetDynamicSectionQuery } from '@/redux/api'
import { ExternalLink, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

function resolveTeamMemberImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured

  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function TeamMemberCardSkeleton({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className="relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <div className="h-56 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="relative z-20 -mt-6 flex flex-1 flex-col p-6">
        <div className="mb-2 h-6 w-2/3 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="mb-6 h-4 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-auto h-9 w-9 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </motion.div>
  )
}

function TeamMemberCard({ item, idx }: { item: DynamicPostListItem; idx: number }) {
  const bio = stripHtml(item.description)
  const imageUrl = resolveTeamMemberImage(item)
  const profileUrl = item.generalInfoUrl

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
    >
      <div className="relative h-56 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        <div className="absolute inset-0 z-10 bg-linear-to-t from-white to-transparent dark:from-zinc-900" />
        {imageUrl ? (
          <Image
            width={400}
            height={300}
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover object-top opacity-80 grayscale-30 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <UsersRound size={40} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}
      </div>

      <div className="relative z-20 -mt-6 flex flex-1 flex-col p-6">
        <h3 className="mb-3 text-xl font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
          {item.title}
        </h3>

        {bio ? (
          <p className="mb-6 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">{bio}</p>
        ) : null}

        {profileUrl ? (
          <div className="mt-auto flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
              <ExternalLink size={14} />
            </span>
            <span className="text-sm font-semibold text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100">
              View profile
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  )

  if (profileUrl) {
    return (
      <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
        {card}
      </a>
    )
  }

  return card
}

function MeetOurTeamSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="mb-4 min-h-[220px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, idx) => (
          <TeamMemberCardSkeleton key={idx} idx={idx} />
        ))}
      </div>
    </div>
  )
}

type MeetOurTeamSectionProps = {
  sectionName?: string
}

export const MeetOurTeamSection = ({ sectionName = 'Meet Our Team' }: MeetOurTeamSectionProps) => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const resolvedSectionName = sectionName.trim() || 'Meet Our Team'
  const accent = design?.accentColor ?? (design?.profileTemplate === 'v1' ? '#dcc969' : '#eab308')

  const { data, isLoading, isError } = useGetDynamicSectionQuery(
    { profileId, sectionName: resolvedSectionName },
    { skip: !profileId || !resolvedSectionName }
  )

  const sectionTitle = data?.sectionTitle ?? resolvedSectionName
  const members = data?.posts ?? []
  const showInitialLoader = isLoading && members.length === 0
  const showEmptyState = !isLoading && !isError && members.length === 0

  if (!profileId) return null

  if (showInitialLoader) {
    return <MeetOurTeamSkeleton />
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
            <UsersRound size={24} style={{ color: accent }} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No team members have been published yet. Add content from the vCard editor Meet Our Team tab.
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

          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <UsersRound size={12} className="text-yellow-primary" /> Our People
            </div>

            <h2 className="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {sectionTitle.includes(' ') ? (
                <>
                  {sectionTitle.slice(0, sectionTitle.lastIndexOf(' '))}{' '}
                  <span className="text-yellow-primary font-medium italic">
                    {sectionTitle.slice(sectionTitle.lastIndexOf(' ') + 1)}
                  </span>
                </>
              ) : (
                sectionTitle
              )}
            </h2>
            <p className="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400">
              The dedicated professionals behind your success — experts in design, technology, and client experience.
            </p>
          </div>
        </div>
      </div>

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, idx) => (
          <TeamMemberCard key={member.id} item={member} idx={idx} />
        ))}
      </div>
    </div>
  )
}
