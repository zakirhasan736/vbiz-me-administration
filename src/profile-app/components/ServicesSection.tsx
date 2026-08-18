'use client'

import { ServiceDetail } from '@/profile-app/components/ServiceDetail'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3SectionHeader } from '@/profile-app/sections'
import { useGetServicesQuery } from '@/redux/api'
import { ArrowUpRight, Layers, Wrench } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

const SKELETON_CARD_COUNT = 3

function ServiceCardSkeleton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex min-h-55 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <div className="mb-4 h-32 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-16 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
    </motion.div>
  )
}

export const ServicesSection = () => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const [selectedServiceId, setSelectedServiceId] = useState<number | string | null>(null)

  const { data, isLoading, isError } = useGetServicesQuery(profileId, { skip: !profileId })

  const services = data?.services ?? []
  const sectionTitle = data?.sectionTitle ?? 'Services'
  const showInitialLoader = isLoading && services.length === 0
  const showEmptyState = !isLoading && !isError && services.length === 0
  const selectedService = services.find((service) => service.id === selectedServiceId)

  if (!profileId) return null

  if (selectedService) {
    return (
      <ServiceDetail service={selectedService} sectionTitle={sectionTitle} onBack={() => setSelectedServiceId(null)} />
    )
  }

  if (showInitialLoader) {
    return (
      <div className="w-full pb-20">
        <SectionHeader sectionTitle={sectionTitle} isLoading />
        <div className="vbiz-bento-grid relative z-20 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
            <ServiceCardSkeleton key={idx} delay={idx * 0.08} />
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
          Unable to load services right now. Please try again later.
        </div>
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800/80">
            <Wrench size={24} />
          </div>
          <h2 className="vbiz-title mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {sectionTitle}
          </h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No services have been published yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <SectionHeader sectionTitle={sectionTitle} />

      <div className="vbiz-bento-grid relative z-20 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, idx) => {
          const imageUrl = service.featuredImage.trim()
          const hasDetail = Boolean(service.htmlDescription.trim() || service.description.trim())
          const isClickable = hasDetail

          const card = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={`group relative flex min-h-55 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 md:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80${isClickable ? 'cursor-pointer' : ''}`}
            >
              {imageUrl ? (
                <div className="mb-4 h-32 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={service.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/70">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-[#eab308] shadow-sm transition-transform duration-300 group-hover:scale-110 dark:border-zinc-700 dark:bg-zinc-800/80">
                    <Wrench size={22} />
                  </div>
                </div>
              )}
              <h3 className="mb-2 text-xl leading-tight font-bold text-zinc-900 dark:text-zinc-100">{service.title}</h3>
              {service.description ? (
                <p className="mb-4 line-clamp-4 flex-1 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
                  {service.description}
                </p>
              ) : null}
              {service.url ? (
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
                >
                  Learn more <ArrowUpRight size={16} />
                </a>
              ) : isClickable ? (
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-[#eab308]">
                  View details <ArrowUpRight size={14} />
                </span>
              ) : null}
            </motion.div>
          )

          if (isClickable) {
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedServiceId(service.id)}
                className="block w-full text-left"
              >
                {card}
              </button>
            )
          }

          return <div key={service.id}>{card}</div>
        })}
      </div>
    </div>
  )
}

function SectionHeader({ sectionTitle }: { sectionTitle: string; isLoading?: boolean }) {
  return (
    <V3SectionHeader
      badge="Services"
      badgeIcon={Layers}
      title={sectionTitle}
      subtitle="Services and offerings from your vBiz profile."
    />
  )
}
