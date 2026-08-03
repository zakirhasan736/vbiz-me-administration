'use client'

import type { ProfileAiExperience } from '@/interfaces/api/profileAiData'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetProfileAiDataQuery } from '@/redux/api'
import { Briefcase } from 'lucide-react'
import { motion } from 'motion/react'

function formatExperienceDate(date: string | null | undefined): string {
  if (!date?.trim()) return ''
  const parsed = new Date(`${date.trim()}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatExperiencePeriod(entry: ProfileAiExperience): string {
  const from = formatExperienceDate(entry.from_date)
  const to = entry.current_status === 1 ? 'Present' : formatExperienceDate(entry.to_date)
  if (!from && !to) return ''
  if (!from) return to
  if (!to) return from
  return `${from} – ${to}`
}

function ExperienceSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="vbiz-card mb-4 min-h-[220px] animate-pulse rounded-3xl border" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="vbiz-card h-[200px] animate-pulse rounded-3xl border" />
        <div className="vbiz-card h-[200px] animate-pulse rounded-3xl border" />
      </div>
    </div>
  )
}

type ExperienceSectionProps = {
  sectionName?: string
}

/**
 * Work experience — data from `GET /profile-ai-data/{profile_id}` (`experience` array).
 */
export function ExperienceSection({ sectionName = 'Work Experience' }: ExperienceSectionProps) {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const sectionTitle = sectionName.trim() || 'Work Experience'

  const { data, isLoading, isError } = useGetProfileAiDataQuery(profileId, { skip: !profileId })

  const entries = (data?.experience ?? []).filter(
    (entry) => entry.company?.trim() || entry.title?.trim() || entry.job_title?.trim()
  )
  const showInitialLoader = isLoading && entries.length === 0
  const showEmptyState = !isLoading && !isError && entries.length === 0

  if (!profileId) return null
  if (showInitialLoader) return <ExperienceSkeleton />

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
        <div className="vbiz-card flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed p-10 text-center">
          <div className="vbiz-pill-icon mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border">
            <Briefcase size={24} />
          </div>
          <h2 className="vbiz-title mb-3 text-2xl font-bold tracking-tight">{sectionTitle}</h2>
          <p className="vbiz-description max-w-md text-sm leading-relaxed font-medium">
            No work experience entries have been published yet.
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
              <Briefcase size={12} /> {sectionTitle}
            </div>
            <h2 className="vbiz-title mb-4 max-w-2xl text-2xl leading-[1.1] font-bold tracking-tight sm:text-4xl lg:text-4xl">
              Professional <span className="vbiz-accent-text font-medium italic">Journey</span>
            </h2>
            <p className="vbiz-description max-w-xl text-base leading-normal font-medium lg:text-lg">
              Roles, companies, and career milestones from your profile.
            </p>
          </div>
        </div>
      </div>

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {entries.map((entry, idx) => {
          const period = formatExperiencePeriod(entry)
          const company = entry.company?.trim() || entry.title?.trim() || 'Company'
          const jobTitle = entry.job_title?.trim() || (entry.company?.trim() ? entry.title?.trim() : '') || ''
          const detail = entry.description?.trim() ?? ''
          return (
            <motion.div
              key={`${company}-${jobTitle}-${entry.from_date}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="vbiz-card group relative flex flex-col overflow-hidden rounded-3xl border p-6 shadow-sm backdrop-blur-xl transition-colors duration-300 md:p-8"
            >
              <div className="vbiz-pill-icon mb-4 flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Briefcase size={22} />
              </div>
              <h3 className="vbiz-title mb-2 text-xl leading-tight font-bold transition-colors">{company}</h3>
              {jobTitle ? <p className="vbiz-description mb-4 text-sm font-medium">{jobTitle}</p> : null}
              {detail ? <p className="vbiz-description mb-4 text-sm leading-relaxed">{detail}</p> : null}
              {period ? (
                <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
                  <span className="vbiz-description text-[10px] font-bold tracking-wider uppercase">Period</span>
                  <p className="vbiz-title mt-1 font-semibold">{period}</p>
                </div>
              ) : null}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
