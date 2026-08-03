'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetAdditionalServicesQuery } from '@/redux/api'
import { ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import type { CSSProperties } from 'react'

function resolveServiceImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured

  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function AdditionalServicesSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="min-h-[280px] animate-pulse rounded-2xl border border-l-4 border-zinc-200 border-l-zinc-300 bg-zinc-200 shadow-sm dark:border-zinc-800/80 dark:border-l-zinc-600 dark:bg-zinc-800" />
    </div>
  )
}

function ServiceCard({ item, accent }: { item: DynamicPostListItem; accent: string }) {
  const description = stripHtml(item.description)
  const serviceLink = item.generalInfoUrl
  const imageUrl = resolveServiceImage(item)

  const cardClassName =
    'group relative block overflow-hidden rounded-2xl border border-zinc-200/80 bg-linear-to-br from-[#faf8f5] via-white to-[#f5f3ef] px-6 py-10 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.995] sm:px-10 sm:py-12 dark:border-zinc-800/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:focus-visible:ring-offset-zinc-950'

  const cardStyle = { '--tw-ring-color': accent } as CSSProperties

  const content = (
    <>
      <div
        aria-hidden
        className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        {imageUrl ? (
          <div className="relative mb-6 h-24 w-24 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-md transition-transform duration-300 group-hover:scale-105 sm:mb-8 sm:h-28 sm:w-28 dark:border-zinc-700 dark:bg-zinc-950">
            <Image src={imageUrl} alt={item.title} fill className="object-contain p-2" sizes="112px" />
          </div>
        ) : null}

        <h2 className="mb-3 text-xl leading-snug font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-950 sm:text-2xl lg:text-3xl dark:text-zinc-100 dark:group-hover:text-white">
          {item.title}
        </h2>

        {description ? (
          <p className="mb-5 max-w-2xl text-sm leading-relaxed font-medium text-zinc-600 sm:text-base dark:text-zinc-400">
            {description}
          </p>
        ) : null}

        {serviceLink ? (
          <span className="text-sm font-semibold text-zinc-500 underline-offset-4 transition-colors group-hover:text-zinc-900 group-hover:underline dark:text-zinc-400 dark:group-hover:text-zinc-100">
            Learn more
          </span>
        ) : null}
      </div>
    </>
  )

  if (serviceLink) {
    return (
      <a
        href={serviceLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardClassName} cursor-pointer`}
        style={cardStyle}
      >
        {content}
      </a>
    )
  }

  return (
    <article className={cardClassName} style={cardStyle}>
      {content}
    </article>
  )
}

export const AdditionalServicesSection = () => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const accent = design?.accentColor ?? (design?.profileTemplate === 'v1' ? '#dcc969' : '#eab308')

  const { data, isLoading, isError } = useGetAdditionalServicesQuery(profileId, { skip: !profileId })

  const sectionTitle = data?.sectionTitle ?? 'Additional Services'
  const services = data?.posts ?? []
  const showInitialLoader = isLoading && services.length === 0
  const showEmptyState = !isLoading && !isError && services.length === 0

  if (!profileId) return null

  if (showInitialLoader) {
    return <AdditionalServicesSkeleton />
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
            <ShieldCheck size={24} style={{ color: accent }} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No additional services have been published yet. Add content from the vCard editor Additional Services tab.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-20">
      {services.map((item) => (
        <ServiceCard key={item.id} item={item} accent={accent} />
      ))}
    </div>
  )
}
