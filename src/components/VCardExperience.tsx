'use client'

import { SectionJumpPills } from '@/components/SectionJumpPills'
import {
  ExpandableEntryBody,
  ExpandableEntryHeader,
  bottomAddButtonClass,
  expandableCardClassName,
} from '@/components/vcard/ExpandableEntryChrome'
import { VCardDateInput } from '@/components/vcard/VCardDateInput'
import { useExpandableEntryList } from '@/hooks/useExpandableEntryList'
import { useVCard } from '@/lib/VCardContext'
import { createDefaultExperienceEntry, normalizeExperienceList } from '@/lib/vcardExperience'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import type { VCardExperienceEntry } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Briefcase, Plus } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm'

const accent = {
  border: 'border-orange-100 dark:border-orange-500/20',
  bg: 'bg-orange-50 dark:bg-orange-500/10',
  text: 'text-orange-600 dark:text-orange-400',
  chevronOpen: 'text-orange-500',
  cardExpandedBorder: 'border-orange-200/60 dark:border-orange-500/20',
}

export function TabExperience() {
  const sectionTitle = useResolvedSectionTitle(undefined, 'Experience')
  const { vCardData, updateData } = useVCard()
  const experiences = normalizeExperienceList(vCardData.experience)
  const { isExpanded, toggleExpanded, expandNew, recoverExpandedAfterRemove, setCardRef, setExpandedId } =
    useExpandableEntryList(experiences)

  const setExperiences = (next: VCardExperienceEntry[]) => {
    updateData('experience', next)
  }

  const addExperience = () => {
    const next = createDefaultExperienceEntry()
    setExperiences([...experiences, next])
    expandNew(next.id)
  }

  const removeExperience = (id: string) => {
    const next = experiences.filter((exp) => exp.id !== id)
    const resolved = next.length ? next : [createDefaultExperienceEntry()]
    setExperiences(resolved)
    recoverExpandedAfterRemove(id, resolved)
  }

  const updateExperience = (id: string, field: keyof VCardExperienceEntry, value: string | boolean) => {
    setExperiences(experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)))
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="mb-8 rounded-3xl border border-orange-100 bg-orange-50/50 p-6 dark:border-orange-500/10 dark:bg-orange-500/2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-orange-100 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10">
              <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-black text-orange-600 dark:text-orange-400">{sectionTitle}</h3>
          </div>
          <button
            type="button"
            onClick={addExperience}
            className="hidden items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-orange-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add Experience
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Add your professional work experience and career milestones. Changes appear instantly in the live preview (v1
          and v2 layouts).
        </p>
        <button
          type="button"
          onClick={addExperience}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-orange-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Experience
        </button>
      </div>

      <SectionJumpPills
        accent="orange"
        label="Quick find"
        onJump={setExpandedId}
        items={experiences.map((exp) => ({
          id: exp.id,
          title: exp.company || 'New Experience Entry',
          detail: exp.jobTitle || undefined,
        }))}
      />

      <div className="space-y-4">
        {experiences.map((exp, index) => {
          const open = isExpanded(exp.id)
          return (
            <section
              key={exp.id}
              id={`entry-${exp.id}`}
              ref={(el) => setCardRef(exp.id, el)}
              className={cn(expandableCardClassName(open, accent), 'scroll-mt-24')}
            >
              <ExpandableEntryHeader
                indexLabel={index + 1}
                title={exp.company || 'New Experience Entry'}
                subtitle={exp.jobTitle}
                isExpanded={open}
                onToggle={() => toggleExpanded(exp.id)}
                showRemove={experiences.length > 1}
                onRemove={() => removeExperience(exp.id)}
                accent={accent}
              />

              <ExpandableEntryBody
                isExpanded={open}
                className="grid grid-cols-1 gap-x-6 gap-y-8 p-4 sm:p-8 md:grid-cols-2"
              >
                <div className="group flex flex-col space-y-1.5 md:col-span-2">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder="e.g. Google"
                    className={inputClasses}
                  />
                </div>
                <div className="group flex flex-col space-y-1.5 md:col-span-2">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className={inputClasses}
                  />
                </div>
                <div className="group flex flex-col space-y-1.5 md:col-span-2">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Description
                  </label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                    className={inputClasses.replace('h-min', 'resize-y')}
                  />
                </div>
                <div className="group flex flex-col space-y-1.5">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Start Date
                  </label>
                  <VCardDateInput
                    value={exp.fromDate}
                    onChange={(e) => updateExperience(exp.id, 'fromDate', e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="group flex flex-col space-y-1.5">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    End Date
                  </label>
                  <VCardDateInput
                    value={exp.toDate}
                    onChange={(e) => updateExperience(exp.id, 'toDate', e.target.value)}
                    disabled={exp.tillNow}
                    className={cn(
                      inputClasses,
                      exp.tillNow
                        ? 'cursor-not-allowed border-transparent bg-slate-200/50 opacity-50 dark:bg-white/5'
                        : ''
                    )}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 md:col-span-2">
                  <label className="group flex cursor-pointer items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={exp.tillNow}
                        onChange={(e) => updateExperience(exp.id, 'tillNow', e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] border-slate-600 shadow-inner transition-colors group-hover:border-slate-400 peer-checked:border-orange-500 peer-checked:bg-orange-500">
                        <svg
                          className={cn(
                            'h-3 w-3 scale-0 text-slate-900 transition-transform peer-checked:scale-100',
                            exp.tillNow ? 'scale-100' : ''
                          )}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                    <span className="text-[13px] font-bold text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400">
                      I currently work here
                    </span>
                  </label>
                </div>
              </ExpandableEntryBody>
            </section>
          )
        })}

        <div className="mt-8 flex flex-col items-center gap-4 pt-6">
          <button
            type="button"
            onClick={addExperience}
            className={cn(bottomAddButtonClass, 'text-orange-600 hover:border-orange-500/30 dark:text-orange-400')}
          >
            <Plus className="h-4 w-4" /> Add Experience
          </button>
        </div>
      </div>
    </div>
  )
}
