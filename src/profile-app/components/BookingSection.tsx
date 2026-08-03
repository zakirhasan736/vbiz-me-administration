'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetBookingQuery } from '@/redux/api'
import { CalendarDays } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

function resolveBookingImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured

  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function BookingCardSkeleton({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className="overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="h-44 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-1/3 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </motion.div>
  )
}

type BookingCardProps = {
  item: DynamicPostListItem
  idx: number
  accent: string
  primaryColor: string
}

function BookingCard({ item, idx, accent, primaryColor }: BookingCardProps) {
  const imageUrl = resolveBookingImage(item)
  const bookingUrl = item.generalInfoUrl.trim()
  const availableBg = `color-mix(in srgb, ${primaryColor} 10%, #dcfce7)`
  const availableText = `color-mix(in srgb, ${primaryColor} 30%, #15803d)`

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900"
      style={{ borderColor: accent }}
    >
      <div className="relative h-44 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {imageUrl ? (
          <Image
            width={640}
            height={360}
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <CalendarDays size={40} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/45" />

        <span
          className="absolute top-3 right-3 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-zinc-900 uppercase"
          style={{ backgroundColor: accent }}
        >
          Featured
        </span>

        <p className="absolute inset-0 flex items-center justify-center text-center text-sm font-bold tracking-[0.35em] text-white uppercase">
          Let&apos;s Connect
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 text-lg leading-snug font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
          {item.title}
        </h3>
        <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Book now</p>

        <span
          className="mt-auto inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: availableBg, color: availableText }}
        >
          Available
        </span>
      </div>
    </motion.div>
  )

  if (bookingUrl) {
    return (
      <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
        {card}
      </a>
    )
  }

  return card
}

function BookingSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="mb-4 min-h-[220px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      <div className="relative z-20 mt-4 grid grid-cols-1 gap-4 sm:max-w-md">
        <BookingCardSkeleton idx={0} />
      </div>
    </div>
  )
}

export const BookingSection = () => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')
  const primaryColor = design?.primaryColor ?? accent

  const { data, isLoading, isError } = useGetBookingQuery(profileId, { skip: !profileId })

  const sectionTitle = data?.sectionTitle ?? 'Booking'
  const items = data?.posts ?? []
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  if (!profileId) return null

  if (showInitialLoader) {
    return <BookingSkeleton />
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
            <CalendarDays size={24} style={{ color: accent }} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No booking options have been published yet. Add content from the vCard editor Booking tab.
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
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <CalendarDays size={12} style={{ color: accent }} /> Reservations
            </div>

            <h2 className="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {sectionTitle.includes(' ') ? (
                <>
                  {sectionTitle.slice(0, sectionTitle.lastIndexOf(' '))}{' '}
                  <span className="font-medium italic" style={{ color: accent }}>
                    {sectionTitle.slice(sectionTitle.lastIndexOf(' ') + 1)}
                  </span>
                </>
              ) : (
                sectionTitle
              )}
            </h2>
            <p className="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400">
              Ready to plan your next event? Book a time that works for you and let&apos;s get started.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((item, idx) => (
          <BookingCard key={item.id} item={item} idx={idx} accent={accent} primaryColor={primaryColor} />
        ))}
      </div>
    </div>
  )
}
