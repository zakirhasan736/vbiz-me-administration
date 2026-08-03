'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetClientsQuery } from '@/redux/api'
import { ArrowRight, ExternalLink, Handshake } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'

const CLIENT_LOGO_FALLBACK = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&fit=crop'
const SKELETON_CARD_COUNT = 6

function ClientCardSkeleton({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: (idx % 8) * 0.1, ease: 'easeOut' }}
      className="relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50"
    >
      <div className="h-36 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="relative z-20 -mt-4 flex flex-1 flex-col p-6">
        <div className="mb-2 h-5 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="mb-6 h-3 w-1/3 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
          <div className="flex flex-col gap-1.5">
            <div className="h-2.5 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </motion.div>
  )
}

export const ClientsSection = () => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''

  const { data, isLoading, isError } = useGetClientsQuery(profileId, { skip: !profileId })

  const clients = data?.clients ?? []
  const showInitialLoader = isLoading && clients.length === 0
  const showEmptyState = !isLoading && !isError && clients.length === 0

  if (!profileId) return null

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="group relative flex flex-col items-start justify-between gap-3 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-4 backdrop-blur-xl md:flex-row md:items-center md:gap-0 md:p-6 lg:col-span-4 lg:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full min-w-0 md:w-auto md:flex-1">
            <div className="vbiz-eyebrow mb-2 rounded-lg md:mb-3">
              <Handshake size={12} /> Trusted Partners
            </div>

            <h2 className="mb-0 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl md:mb-2 lg:text-4xl dark:text-zinc-100">
              Organizations We <span className="text-yellow-primary font-medium italic">Serve</span>
            </h2>
            <p className="mt-2 hidden max-w-xl text-base leading-normal font-medium text-zinc-600 md:block dark:text-zinc-400">
              Proud to partner with forward-thinking companies across industries who trust us to elevate their
              professional presence.
            </p>
          </div>

          <button
            type="button"
            className="relative z-10 hidden shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 md:flex md:gap-3 md:px-6 md:py-3.5 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <span className="text-sm font-bold">Become a Client</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {showInitialLoader ? (
        <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
            <ClientCardSkeleton key={idx} idx={idx} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load clients right now. Please try again later.
        </div>
      ) : null}

      {showEmptyState ? (
        <div className="rounded-3xl border border-zinc-200 bg-white/50 px-6 py-12 text-center backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No clients have been added yet.</p>
        </div>
      ) : null}

      {clients.length > 0 ? (
        <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: (idx % 8) * 0.1, ease: 'easeOut' }}
              key={client.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
            >
              <div className="relative h-36 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                <Image
                  width={400}
                  height={200}
                  src={client.logo || CLIENT_LOGO_FALLBACK}
                  alt={client.name}
                  className="h-full w-full object-cover opacity-80 grayscale-50 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0"
                />
              </div>

              <div className="relative z-20 -mt-4 flex flex-1 flex-col p-6">
                <h3 className="mb-1 text-lg font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
                  {client.name}
                </h3>
                {client.description ? (
                  <p className="text-yellow-primary mb-4 text-[10px] font-bold tracking-wider uppercase">
                    {client.description}
                  </p>
                ) : (
                  <div className="mb-4" />
                )}

                <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="mb-0.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                      Partner Since
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-300">{client.since || '—'}</span>
                  </div>
                  {client.linkUrl && (
                    <Link
                      href={client.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${client.name}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-colors duration-300 hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
                    >
                      <ExternalLink
                        size={16}
                        className="text-zinc-500 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-950"
                      />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
