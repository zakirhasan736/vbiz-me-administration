'use client'

import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { CertificateImageLightbox, type CertificatePreview } from '@/profile-app/components/CertificateImageLightbox'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { V3ErrorState, V3PreviewAwareText } from '@/profile-app/sections'
import { useGetDynamicSectionQuery } from '@/redux/api'
import { ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

function resolveInsuranceLicenseImage(item: DynamicPostListItem): string {
  const featured = item.featuredImage.trim()
  if (featured) return featured
  return item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim() ?? ''
}

function formatYear(date: string): string {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? '' : String(parsed.getFullYear())
}

function InsuranceLicenseSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="mb-4 min-h-55 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-90 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
        <div className="h-90 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

function InsuranceLicenseCard({
  item,
  idx,
  accent,
  onOpen,
}: {
  item: DynamicPostListItem
  idx: number
  accent: string
  onOpen: (item: DynamicPostListItem) => void
}) {
  const imageUrl = resolveInsuranceLicenseImage(item)
  const preview = stripHtml(item.description)
  const year = item.year?.trim() || formatYear(item.date)
  const credentialLabel = item.attachments[0]?.doc_name?.trim() || `INS-${item.id}`

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.1 }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(item)
        }
      }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eab308] dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
    >
      <div className="relative h-48 overflow-hidden bg-zinc-100 sm:h-56 dark:bg-zinc-950">
        {imageUrl ? (
          <Image
            width={500}
            height={500}
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover opacity-70 grayscale-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <ShieldCheck size={40} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}

        <div className="absolute top-4 right-4 z-20">
          <div className="flex max-w-48 items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 font-mono text-[10px] tracking-wider text-zinc-600 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
            <ShieldCheck size={12} style={{ color: accent }} />
            <span className="truncate">{credentialLabel}</span>
          </div>
        </div>
      </div>

      <div className="relative z-20 flex flex-1 flex-col p-6 md:p-8">
        <h3 className="mb-2 text-xl leading-tight font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
          {item.title}
        </h3>
        {item.description.trim() ? (
          <div
            className="prose prose-zinc dark:prose-invert mb-6 line-clamp-3 max-w-none text-sm font-medium text-zinc-600 dark:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        ) : preview ? (
          <p className="mb-6 line-clamp-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">{preview}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
          {year ? (
            <div className="flex flex-col">
              <span className="mb-0.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Year Issued</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-300">{year}</span>
            </div>
          ) : (
            <span />
          )}

          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-colors duration-300 group-hover:bg-zinc-900 dark:border-zinc-700 dark:bg-zinc-800">
            <ShieldCheck size={16} style={{ color: accent }} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}

type InsuranceLicenseSectionProps = {
  /** Exact nav/post-type `name` from `/post-types` (e.g. "Insurance License"). */
  sectionName?: string
}

export const InsuranceLicenseSection = ({ sectionName = 'Insurance License' }: InsuranceLicenseSectionProps) => {
  const { cardOwnerId, design } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const resolvedSectionName = sectionName.trim() || 'Insurance License'
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')
  const [preview, setPreview] = useState<CertificatePreview | null>(null)

  const { data, isLoading, isError } = useGetDynamicSectionQuery(
    { profileId, sectionName: resolvedSectionName },
    { skip: !profileId || !resolvedSectionName }
  )

  const sectionTitle = useResolvedSectionTitle(data?.sectionTitle, resolvedSectionName)
  const items = data?.posts ?? []
  const showInitialLoader = isLoading && items.length === 0
  const showEmptyState = !isLoading && !isError && items.length === 0

  const openLicense = (item: DynamicPostListItem) => {
    setPreview({
      title: item.title,
      imageUrl: resolveInsuranceLicenseImage(item),
      description: stripHtml(item.description),
      detailUrl: item.generalInfoUrl.trim(),
      credentialLabel: item.attachments[0]?.doc_name?.trim() || `INS-${item.id}`,
      year: formatYear(item.date),
    })
  }

  if (!profileId) return null
  if (showInitialLoader) return <InsuranceLicenseSkeleton />

  if (isError) {
    return (
      <div className="w-full pb-20">
        <V3ErrorState sectionTitle={sectionTitle} />
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
            <ShieldCheck size={24} style={{ color: accent }} />
          </div>
          <h2 className="vbiz-title mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {sectionTitle}
          </h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            <V3PreviewAwareText published="No insurance licenses have been published yet." />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="vbiz-section-banner group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border p-8 backdrop-blur-xl md:flex-row md:items-center lg:col-span-4 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
          <div
            className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"
            style={{ backgroundColor: `${accent}18` }}
          />
          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <ShieldCheck size={12} style={{ color: accent }} /> Insurance Coverage
            </div>
            <h2 className="mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {sectionTitle}
            </h2>
            <p className="max-w-xl text-base leading-normal font-medium text-zinc-600 dark:text-zinc-400">
              Verified insurance licenses and coverage credentials on file.
            </p>
          </div>
        </div>
      </div>

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <InsuranceLicenseCard key={item.id} item={item} idx={idx} accent={accent} onOpen={openLicense} />
        ))}
      </div>

      <AnimatePresence>
        {preview ? (
          <CertificateImageLightbox preview={preview} accent={accent} onClose={() => setPreview(null)} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
