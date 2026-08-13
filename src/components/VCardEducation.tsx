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
import { createDefaultEducationEntry, normalizeEducationList } from '@/lib/vcardEducation'
import type { VCardEducationEntry } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { GraduationCap, Plus } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm'

const accent = {
  border: 'border-cyan-100 dark:border-cyan-500/20',
  bg: 'bg-cyan-50 dark:bg-cyan-500/10',
  text: 'text-cyan-600 dark:text-cyan-400',
  chevronOpen: 'text-cyan-500',
  cardExpandedBorder: 'border-cyan-200/60 dark:border-cyan-500/20',
}

export function TabEducation() {
  const { vCardData, updateData } = useVCard()
  const educations = normalizeEducationList(vCardData.education)
  const { isExpanded, toggleExpanded, expandNew, recoverExpandedAfterRemove, setCardRef, setExpandedId } =
    useExpandableEntryList(educations)

  const setEducations = (next: VCardEducationEntry[]) => {
    updateData('education', next)
  }

  const addEducation = () => {
    const next = createDefaultEducationEntry()
    setEducations([...educations, next])
    expandNew(next.id)
  }

  const removeEducation = (id: string) => {
    const next = educations.filter((edu) => edu.id !== id)
    const resolved = next.length ? next : [createDefaultEducationEntry()]
    setEducations(resolved)
    recoverExpandedAfterRemove(id, resolved)
  }

  const updateEducation = (id: string, field: keyof VCardEducationEntry, value: string | boolean) => {
    setEducations(educations.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)))
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col duration-500">
      <div className="mb-8 rounded-3xl border border-cyan-100 bg-cyan-50/50 p-6 dark:border-cyan-500/10 dark:bg-cyan-500/2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-cyan-100 bg-cyan-50 dark:border-cyan-500/20 dark:bg-cyan-500/10">
              <GraduationCap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-black text-cyan-600 dark:text-cyan-400">Education History</h3>
          </div>
          <button
            type="button"
            onClick={addEducation}
            className="hidden items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-cyan-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add Education
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Highlight your academic background and achievements. Changes appear instantly in the live preview (v1 and v2
          layouts).
        </p>
        <button
          type="button"
          onClick={addEducation}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-cyan-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Education
        </button>
      </div>

      <SectionJumpPills
        accent="cyan"
        label="Quick find"
        onJump={setExpandedId}
        items={educations.map((edu) => ({
          id: edu.id,
          title: edu.institute || 'New Education Entry',
          detail: edu.degree || undefined,
        }))}
      />

      <div className="space-y-4">
        {educations.map((edu, index) => {
          const open = isExpanded(edu.id)
          return (
            <section
              key={edu.id}
              id={`entry-${edu.id}`}
              ref={(el) => setCardRef(edu.id, el)}
              className={cn(expandableCardClassName(open, accent), 'scroll-mt-24')}
            >
              <ExpandableEntryHeader
                indexLabel={index + 1}
                title={edu.institute || 'New Education Entry'}
                subtitle={edu.degree}
                isExpanded={open}
                onToggle={() => toggleExpanded(edu.id)}
                showRemove={educations.length > 1}
                onRemove={() => removeEducation(edu.id)}
                accent={accent}
              />

              <ExpandableEntryBody
                isExpanded={open}
                className="grid grid-cols-1 gap-x-6 gap-y-8 p-4 sm:p-8 md:grid-cols-2"
              >
                <div className="group flex flex-col space-y-1.5 md:col-span-2">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Institute Name
                  </label>
                  <input
                    type="text"
                    value={edu.institute}
                    onChange={(e) => updateEducation(edu.id, 'institute', e.target.value)}
                    placeholder="e.g. Harvard University"
                    className={inputClasses}
                  />
                </div>
                <div className="group flex flex-col space-y-1.5 md:col-span-2">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Degree Title
                  </label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    className={inputClasses}
                  />
                </div>
                <div className="group flex flex-col space-y-1.5">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Start Date
                  </label>
                  <VCardDateInput
                    value={edu.fromDate}
                    onChange={(e) => updateEducation(edu.id, 'fromDate', e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="group flex flex-col space-y-1.5">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    End Date
                  </label>
                  <VCardDateInput
                    value={edu.toDate}
                    onChange={(e) => updateEducation(edu.id, 'toDate', e.target.value)}
                    disabled={edu.tillNow}
                    className={cn(
                      inputClasses,
                      edu.tillNow ? 'cursor-not-allowed border-transparent bg-black/5 opacity-50' : ''
                    )}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 md:col-span-2">
                  <label className="group flex cursor-pointer items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={edu.tillNow}
                        onChange={(e) => updateEducation(edu.id, 'tillNow', e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer-checked:bg-primary-600 peer-checked:border-primary-600 flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] border-slate-600 shadow-inner transition-colors group-hover:border-slate-400">
                        <svg
                          className={cn(
                            'h-3 w-3 scale-0 text-slate-900 transition-transform peer-checked:scale-100',
                            edu.tillNow ? 'scale-100' : ''
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
                      I currently study here
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
            onClick={addEducation}
            className={cn(bottomAddButtonClass, 'text-cyan-400 hover:border-cyan-500/30')}
          >
            <Plus className="h-4 w-4" /> Add Another Education
          </button>
        </div>
      </div>
    </div>
  )
}
