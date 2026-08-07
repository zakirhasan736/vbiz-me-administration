'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetProfileAiDataQuery } from '@/redux/api'
import { Wand2 } from 'lucide-react'
import { motion } from 'motion/react'

function SkillsSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="vbiz-card mb-4 min-h-55 animate-pulse rounded-3xl border" />
      <div className="flex flex-wrap gap-3">
        <div className="vbiz-card h-10 w-28 animate-pulse rounded-full border" />
        <div className="vbiz-card h-10 w-36 animate-pulse rounded-full border" />
        <div className="vbiz-card h-10 w-24 animate-pulse rounded-full border" />
        <div className="vbiz-card h-10 w-32 animate-pulse rounded-full border" />
      </div>
    </div>
  )
}

type SkillsSectionProps = {
  sectionName?: string
}

/**
 * Skills — data from `GET /profile-ai-data/{profile_id}` (`skills` array).
 */
export function SkillsSection({ sectionName = 'Skills' }: SkillsSectionProps) {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const sectionTitle = sectionName.trim() || 'Skills'

  const { data, isLoading, isError } = useGetProfileAiDataQuery(profileId, { skip: !profileId })

  const skills = (data?.skills ?? []).map((s) => s.trim()).filter(Boolean)
  const showInitialLoader = isLoading && skills.length === 0
  const showEmptyState = !isLoading && !isError && skills.length === 0

  if (!profileId) return null
  if (showInitialLoader) return <SkillsSkeleton />

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
        <div className="vbiz-card flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed p-10 text-center">
          <div className="vbiz-pill-icon mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border">
            <Wand2 size={24} />
          </div>
          <h2 className="vbiz-title mb-3 text-2xl font-bold tracking-tight">{sectionTitle}</h2>
          <p className="vbiz-description max-w-md text-sm leading-relaxed font-medium">
            No skills have been published yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="vbiz-section-banner group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border p-8 backdrop-blur-xl md:flex-row md:items-center lg:col-span-4 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="vbiz-eyebrow mb-6 shadow-sm backdrop-blur-sm">
              <Wand2 size={12} /> {sectionTitle}
            </div>
            <h2 className="vbiz-title mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight sm:text-4xl lg:text-4xl">
              Tools & <span className="vbiz-accent-text font-medium italic">Expertise</span>
            </h2>
            <p className="vbiz-description max-w-xl text-base leading-normal font-medium lg:text-lg">
              Skills and specialties highlighted on this profile.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-4 flex flex-wrap gap-3">
        {skills.map((skill, idx) => (
          <motion.span
            key={`${skill}-${idx}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.04 }}
            className="vbiz-card inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-xl"
          >
            {skill}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
