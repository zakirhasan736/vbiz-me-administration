'use client'

import type { ServiceListItem } from '@/interfaces/api/services.interface'
import { ArrowLeft, ExternalLink, Layers } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

type ServiceDetailProps = {
  service: ServiceListItem
  sectionTitle: string
  onBack: () => void
}

export function ServiceDetail({ service, sectionTitle, onBack }: ServiceDetailProps) {
  const heroImage = service.featuredImage.trim()
  const hasHtml = service.htmlDescription.trim().length > 0

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
          <div className="relative aspect-21/9 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
            <Image src={heroImage} alt={service.title} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
                <Layers size={12} className="text-[#eab308]" /> {sectionTitle}
              </div>
              <h1 className="max-w-4xl text-2xl leading-[1.1] font-bold tracking-tight text-white sm:text-4xl lg:text-4xl">
                {service.title}
              </h1>
            </div>
          </div>
        ) : (
          <div className="border-b border-zinc-200 p-8 lg:p-10 dark:border-zinc-800/80">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Layers size={12} className="text-[#eab308]" /> {sectionTitle}
            </div>
            <h1 className="max-w-4xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
              {service.title}
            </h1>
          </div>
        )}

        <div className="space-y-8 px-5 py-6 lg:p-10">
          {hasHtml ? (
            <div
              className="prose prose-zinc dark:prose-invert max-w-3xl text-base leading-relaxed font-medium lg:text-lg [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_p]:mb-4"
              dangerouslySetInnerHTML={{ __html: service.htmlDescription }}
            />
          ) : service.description ? (
            <p className="max-w-3xl text-base leading-relaxed font-medium whitespace-pre-wrap text-zinc-700 lg:text-lg dark:text-zinc-300">
              {service.description}
            </p>
          ) : null}

          {service.url ? (
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
            >
              Learn more <ExternalLink size={16} />
            </a>
          ) : null}

          {!hasHtml && !service.description && !heroImage ? (
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No additional content for this service.
            </p>
          ) : null}
        </div>
      </article>
    </motion.div>
  )
}
