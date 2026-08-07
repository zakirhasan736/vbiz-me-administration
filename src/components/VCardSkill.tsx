'use client'

import { useVCard } from '@/lib/VCardContext'
import { createDefaultSkillGroup, normalizeSkillGroups } from '@/lib/vcardSkills'
import type { VCardSkillGroup } from '@/types/vcard'
import { Plus, Star, Trash2, X } from 'lucide-react'
import React, { useEffect, useRef } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm'

export function TabSkill() {
  const { vCardData, updateData } = useVCard()
  const skillGroups = normalizeSkillGroups(vCardData.skills)
  const skillGroupsRef = useRef(skillGroups)
  const [inputValues, setInputValues] = React.useState<Record<string, string>>({})
  const inputValuesRef = useRef(inputValues)

  useEffect(() => {
    skillGroupsRef.current = skillGroups
  }, [skillGroups])

  useEffect(() => {
    inputValuesRef.current = inputValues
  }, [inputValues])

  const setSkillGroups = (next: VCardSkillGroup[]) => {
    const normalized = normalizeSkillGroups(next)
    skillGroupsRef.current = normalized
    updateData('skills', normalized)
  }

  const commitPendingInputs = (groups: VCardSkillGroup[] = skillGroupsRef.current): VCardSkillGroup[] => {
    const pending = inputValuesRef.current
    let changed = false
    const next = groups.map((grp) => {
      const typed = (pending[grp.id] || '').trim()
      if (!typed || grp.skills.includes(typed)) return grp
      changed = true
      return { ...grp, skills: [...grp.skills, typed] }
    })
    if (changed) {
      setInputValues({})
      inputValuesRef.current = {}
      setSkillGroups(next)
      return next
    }
    return groups
  }

  const addSkillGroup = () => {
    const current = commitPendingInputs()
    setSkillGroups([...current, createDefaultSkillGroup()])
  }

  const removeSkillGroup = (id: string) => {
    const current = commitPendingInputs()
    const next = current.filter((grp) => grp.id !== id)
    setSkillGroups(next.length ? next : [createDefaultSkillGroup()])
  }

  const updateSkillGroupType = (id: string, type: string) => {
    const current = skillGroupsRef.current
    setSkillGroups(current.map((grp) => (grp.id === id ? { ...grp, type } : grp)))
  }

  const addSkillToGroup = (id: string, skillName: string) => {
    const name = skillName.trim()
    if (!name) return
    const current = skillGroupsRef.current
    setSkillGroups(
      current.map((grp) => {
        if (grp.id !== id) return grp
        if (grp.skills.includes(name)) return grp
        return { ...grp, skills: [...grp.skills, name] }
      })
    )
    setInputValues((prev) => {
      const next = { ...prev, [id]: '' }
      inputValuesRef.current = next
      return next
    })
  }

  const removeSkillFromGroup = (groupId: string, skillName: string) => {
    const current = commitPendingInputs()
    setSkillGroups(
      current.map((grp) => {
        if (grp.id !== groupId) return grp
        return { ...grp, skills: grp.skills.filter((s) => s !== skillName) }
      })
    )
  }

  const handleKeyDown = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    addSkillToGroup(id, inputValuesRef.current[id] || '')
  }

  const updateInputValue = (id: string, value: string) => {
    setInputValues((prev) => {
      const next = { ...prev, [id]: value }
      inputValuesRef.current = next
      return next
    })
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="mb-8 rounded-3xl border border-purple-100 bg-purple-50/50 p-6 dark:border-purple-500/10 dark:bg-purple-500/2">
        <div className="mb-2 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10">
            <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-black text-purple-600 dark:text-purple-400">Skills</h3>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Highlight your top skills and expertise. Press Enter to add each skill — changes autosave to your public card.
        </p>
      </div>

      <div className="space-y-8">
        {skillGroups.map((group, index) => (
          <section
            key={group.id}
            className="group/card overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
          >
            <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100 bg-purple-50 font-black text-purple-600 shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                  {index + 1}
                </div>
                <h4 className="text-[16px] font-black text-slate-900 dark:text-white">
                  {group.type || 'New Skill Category'}
                </h4>
              </div>
              {skillGroups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSkillGroup(group.id)}
                  className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 font-bold text-red-500 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                  title="Remove Entry"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              )}
            </div>

            <div className="space-y-8 p-4 sm:p-8">
              <div className="group flex flex-col space-y-1.5">
                <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                  Skill Category
                </label>
                <input
                  type="text"
                  value={group.type}
                  onChange={(e) => updateSkillGroupType(group.id, e.target.value)}
                  placeholder="e.g. Frontend Development"
                  className={inputClasses}
                />
              </div>

              <div className="group flex flex-col space-y-1.5">
                <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                  Skills
                </label>
                <div className="flex min-h-15 w-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 dark:border-white/10 dark:bg-[#0b0f19]">
                  {group.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {group.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-2 text-[13px] font-bold text-purple-600 shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillFromGroup(group.id, skill)}
                            className="ml-1 rounded-md p-0.5 transition-colors hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-500/20 dark:hover:text-purple-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={inputValues[group.id] || ''}
                    onChange={(e) => updateInputValue(group.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(group.id, e)}
                    onBlur={() => {
                      const typed = (inputValuesRef.current[group.id] || '').trim()
                      if (typed) addSkillToGroup(group.id, typed)
                    }}
                    placeholder="Type a skill and press Enter..."
                    className="mt-1 w-full bg-transparent py-1 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                  />
                </div>
              </div>
            </div>
          </section>
        ))}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
          <button
            type="button"
            onClick={addSkillGroup}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white px-6 py-4 text-[13px] font-bold text-purple-600 shadow-sm transition-all hover:border-purple-500/30 hover:bg-slate-200 active:scale-95 sm:w-auto dark:border-white/5 dark:bg-[#0b0f19] dark:text-purple-400"
          >
            <Plus className="h-4 w-4" /> Add New Skill Category
          </button>
        </div>
      </div>
    </div>
  )
}
