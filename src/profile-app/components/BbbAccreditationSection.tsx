'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetBbbAccreditationQuery } from '@/redux/api'
import { Shield } from 'lucide-react'
import Image from 'next/image'

function resolveBbbImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured

  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function BbbAccreditationSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="min-h-[180px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
    </div>
  )
}

function BbbAccreditationCard({ item, buttonLabel }: { item: DynamicPostListItem; buttonLabel: string }) {
  const imageUrl = resolveBbbImage(item)
  const verifyUrl = item.generalInfoUrl

  const content = (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
      {imageUrl ? (
        <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm sm:h-40 sm:w-40 dark:border-zinc-700 dark:bg-zinc-950">
          <Image src={imageUrl} alt={item.title} fill className="object-contain p-2" sizes="160px" />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col items-start gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">{item.title}</h2>

        {verifyUrl ? (
          <span className="inline-flex items-center justify-center rounded-md border border-zinc-900 bg-white px-5 py-2.5 text-xs font-semibold tracking-wide text-zinc-900 uppercase shadow-sm transition-colors group-hover:bg-zinc-50 dark:border-zinc-200 dark:bg-zinc-950 dark:text-zinc-100 dark:group-hover:bg-zinc-900">
            {buttonLabel}
          </span>
        ) : null}
      </div>
    </div>
  )

  if (verifyUrl) {
    return (
      <a
        href={verifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-zinc-200/80 bg-white px-6 py-8 shadow-sm transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-10 sm:py-10 dark:border-zinc-800/80 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950"
      >
        {content}
      </a>
    )
  }

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10 dark:border-zinc-800/80 dark:bg-zinc-900">
      {content}
    </article>
  )
}

export const BbbAccreditationSection = () => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const accent = design?.accentColor ?? (design?.profileTemplate === 'v1' ? '#dcc969' : '#eab308')

  const { data, isLoading, isError } = useGetBbbAccreditationQuery(profileId, { skip: !profileId })

  const sectionTitle = data?.sectionTitle ?? 'Better Business Bureau (BBB) Accreditation'
  const items = data?.posts ?? []
  const buttonLabel = sectionTitle.toUpperCase()
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  if (!profileId) return null

  if (showInitialLoader) {
    return <BbbAccreditationSkeleton />
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
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
            <Shield size={24} style={{ color: accent }} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No BBB accreditation has been published yet. Add content from the vCard editor BBB tab.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-20">
      {items.map((item) => (
        <BbbAccreditationCard key={item.id} item={item} buttonLabel={buttonLabel} />
      ))}
    </div>
  )
}
