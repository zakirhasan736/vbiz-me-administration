'use client'

import { formatExperienceDateRange, getPublishedExperienceEntries } from '@/lib/vcardExperience'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { Briefcase } from 'lucide-react'
import { motion } from 'motion/react'

export function ExperienceSection() {
  const { experience, isVisible } = useProfileDisplay()
  const entries = getPublishedExperienceEntries(experience)

  if (!isVisible('Work Experience')) {
    return null
  }

  if (entries.length === 0) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-orange-500 dark:border-zinc-700 dark:bg-zinc-800/80">
            <Briefcase size={24} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Work Experience</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            Add experience entries from the vCard editor → Work Experience tab. Published entries appear here on v1 and
            v2 profiles.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-center lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
          <div className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full bg-orange-500/10 p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110 dark:bg-orange-500/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Briefcase size={12} className="text-orange-500 dark:text-orange-400" /> Experience
            </div>
            <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              Professional <span className="font-medium text-orange-600 italic dark:text-orange-400">Journey</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              Roles, companies, and career milestones from your vCard editor.
            </p>
          </div>
        </div>
      </div>

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {entries.map((entry, idx) => {
          const period = formatExperienceDateRange(entry)
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 md:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-200/80 bg-orange-50 text-orange-600 shadow-sm transition-transform duration-300 group-hover:scale-110 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400">
                <Briefcase size={22} />
              </div>
              <h3 className="mb-2 text-xl leading-tight font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
                {entry.company.trim() || 'Company'}
              </h3>
              {entry.jobTitle.trim() ? (
                <p className="mb-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">{entry.jobTitle}</p>
              ) : null}
              {entry.description.trim() ? (
                <p className="mb-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{entry.description}</p>
              ) : null}
              {period ? (
                <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Period</span>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-300">{period}</p>
                </div>
              ) : null}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
