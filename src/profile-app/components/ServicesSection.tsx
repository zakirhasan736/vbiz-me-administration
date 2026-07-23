'use client'

import { getPublishedServiceEntries } from '@/lib/vcardServices'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { ArrowUpRight, Layers, Wrench } from 'lucide-react'
import { motion } from 'motion/react'

export const ServicesSection = () => {
  const { services, isVisible } = useProfileDisplay()
  const entries = getPublishedServiceEntries(services)

  if (!isVisible('Services') || entries.length === 0) {
    return null
  }

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:col-span-3 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50"
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
          <div className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full bg-[#eab308]/10 p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110 dark:bg-[#eab308]/5" />

          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Layers size={12} className="text-[#eab308]" /> Services
            </div>
            <h2 className="mb-6 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              What I <span className="font-medium text-[#eab308] italic">Offer</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 lg:text-lg dark:text-zinc-400">
              Services and offerings managed from your vCard back office.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="vbiz-bento-grid relative z-20 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 md:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
          >
            {service.featuredImage.trim() ? (
              <div className="mb-4 h-32 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.featuredImage.trim()}
                  alt={service.title || 'Service'}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-[#eab308] shadow-sm transition-transform duration-300 group-hover:scale-110 dark:border-zinc-700 dark:bg-zinc-800/80">
                <Wrench size={22} />
              </div>
            )}
            {service.type.trim() ? (
              <span className="mb-2 inline-flex w-fit rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-600 uppercase dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
                {service.type}
              </span>
            ) : null}
            <h3 className="mb-2 text-xl leading-tight font-bold text-zinc-900 dark:text-zinc-100">
              {service.title.trim() || 'Service'}
            </h3>
            {service.description.trim() ? (
              <p className="mb-4 flex-1 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
                {service.description}
              </p>
            ) : null}
            {service.url.trim() ? (
              <a
                href={service.url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
              >
                Learn more <ArrowUpRight size={16} />
              </a>
            ) : null}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
